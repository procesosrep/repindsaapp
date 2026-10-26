import {cashContext,cashOwned} from '../../cash-server';
import {auditAccess} from '../../audit-server';
import {visibleRows} from '../../permissions';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const c=await cashContext(req);if(!c)return reply({error:'Inicia sesión.'},401);
 const p=new URL(req.url).searchParams,id=p.get('recordId'),global=auditAccess(c.profile);
 if(!id&&!global)return reply({error:'La bitácora general es sólo para Administración y Dirección.'},403);
 if(id&&!global){const record=c.rows.find(r=>r.id===id);if(!record||!visibleRows(c.rows,c.profile).some(r=>r?.id===id)&&!cashOwned(record,c))return reply({error:'Registro fuera de tu alcance.'},403);}
 const clauses:string[]=[],args:any[]=[];
 if(id){clauses.push('a.record_id=?');args.push(id);}
 const before=p.get('before');if(before){if(!/^\d+$/.test(before))return reply({error:'Página inválida.'},400);clauses.push('a.id<?');args.push(Number(before));}
 const q=p.get('q')?.trim().slice(0,150);if(q){clauses.push("(a.label LIKE ? OR a.actor LIKE ? OR a.action LIKE ? OR a.actor_name LIKE ? OR json_extract(m.payload,'$.name') LIKE ?)");args.push(...Array(5).fill('%'+q+'%'));}
 for(const [key,op,suffix] of [['from','>=','T00:00:00-06:00'],['to','<=','T23:59:59.999-06:00']]){const date=p.get(key);if(!date)continue;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+suffix)))return reply({error:'Fecha inválida.'},400);clauses.push('julianday(a.occurred_at)'+op+'julianday(?)');args.push(date+suffix);}
 const result=await c.db.prepare(`SELECT a.*,COALESCE(a.actor_name,json_extract(m.payload,'$.name'),a.actor) AS actorName FROM operation_audit a LEFT JOIN records m ON m.id='local-member-'||replace(a.actor,'usuario:','') ${clauses.length?'WHERE '+clauses.join(' AND '):''} ORDER BY a.id DESC LIMIT 101`).bind(...args).all();
 const entries=result.results.slice(0,100);return reply({entries,next:result.results.length>100?entries[entries.length-1].id:null});
}
