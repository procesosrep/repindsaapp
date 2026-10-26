import {randomUUID} from 'node:crypto';

export function recordMutation(sql) {
  const match=sql.match(/^\s*(INSERT(?:\s+OR\s+IGNORE)?\s+INTO|UPDATE|DELETE\s+FROM)\s+`?records`?\b/i);
  if(!match)return null;
  return match[1].toUpperCase().startsWith('INSERT')?'INSERT':match[1].toUpperCase().startsWith('DELETE')?'DELETE':'UPDATE';
}

// Only the app's single-record parameterized mutations are allowed in this path.
// Fail before executing unsupported SQL rather than silently omit its audit event.
export function recordIdentity(sql,args) {
  const raw=sql.match(/'(?:''|\\.|[^'\\])*'|`[^`]*`|\?|[a-z_][a-z_0-9]*|\d+|[^\s]/gi)||[];
  let position=0;
  const tokens=raw.map(text=>({text,arg:text==='?'?position++:null}));
  const name=token=>token?.text.replaceAll('`','').toLowerCase();
  const value=token=>token?.arg!==null&&token?.arg!==undefined?args[token.arg]:token?.text.startsWith("'")?token.text.slice(1,-1).replaceAll("''", "'").replace(/\\(.)/g,'$1'):undefined;
  if(recordMutation(sql)==='INSERT') {
    const table=tokens.findIndex(t=>name(t)==='records');
    if(tokens[table+1]?.text!=='(')throw Error('INSERT records sin lista de columnas no soportado por auditoría.');
    const end=tokens.findIndex((t,i)=>i>table&&t.text===')');
    const columns=tokens.slice(table+2,end).filter(t=>t.text!==',');
    const id=columns.findIndex(t=>name(t)==='id');
    const values=tokens.findIndex((t,i)=>i>end&&name(t)==='values');
    if(id<0||values<0||tokens[values+1]?.text!=='(')throw Error('INSERT records sin identidad verificable.');
    let depth=1;const fields=[[]];let closed=false;let closingIndex=-1;
    for(let i=values+2;i<tokens.length;i++) {
      const token=tokens[i];
      if(token.text==='(')depth++;
      if(token.text===')'){depth--;if(depth===0){closed=true;closingIndex=i;break;}}
      if(token.text===','&&depth===1)fields.push([]);else fields.at(-1).push(token);
    }
    if(tokens[closingIndex+1]?.text===',')throw Error('INSERT records de varias filas no soportado por auditoría.');
    if(!closed||fields[id]?.length!==1)throw Error('Identidad de INSERT records no soportada.');
    const result=value(fields[id][0]);if(typeof result!=='string')throw Error('ID de registro inválido para auditoría.');return result;
  }
  const where=tokens.findIndex(t=>name(t)==='where');
  if(tokens.slice(where+1).some(t=>['or','union'].includes(name(t))))throw Error('La auditoría requiere un único ID de registro.');
  if(where<0)throw Error('La auditoría requiere modificar records mediante su ID.');
  const index=tokens.findIndex((t,i)=>i>where&&name(t)==='id'&&tokens[i+1]?.text==='=');
  const result=index<0?undefined:value(tokens[index+2]);
  if(typeof result!=='string')throw Error('La auditoría requiere un ID de registro verificable.');
  return result;
}

export async function captureRecordChange(connection,operation,before,after) {
  if(operation==='UPDATE'&&before?.payload===after?.payload)return;
  const row=after||before;if(!row)return;
  const record=JSON.parse(row.payload);const previous=before?JSON.parse(before.payload):null;
  const last=Array.isArray(record.history)?record.history.at(-1):undefined;const previousLast=Array.isArray(previous?.history)?previous.history.at(-1):undefined;
  const changed=JSON.stringify(last)!==JSON.stringify(previousLast);
  const actor=operation==='DELETE'?'sistema':operation==='UPDATE'&&!changed?(record.updatedBy??'sistema'):(last?.actor??record.updatedBy??record.actor??record.createdBy??'sistema');
  const actorName=operation==='DELETE'||operation==='UPDATE'&&!changed?null:last?.actorName??null;
  const action=operation==='DELETE'?'Registro retirado':operation==='UPDATE'?(changed?(last?.action??'Registro actualizado'):'Registro actualizado'):(last?.action??record.message??'Registro creado');
  const changes=operation==='DELETE'?null:last?.changes??null;
  await connection.execute('INSERT INTO operation_audit(event_key,record_id,kind,label,actor,actor_name,occurred_at,action,previous_status,status,changes,origin) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[
    'live:'+randomUUID(),row.id,row.kind,record.folio??record.name??row.id,actor,actorName,new Date().toISOString(),action,previous?.status??null,operation==='DELETE'?null:record.status??null,changes===null||typeof changes==='string'?changes:JSON.stringify(changes),'live',
  ]);
}
