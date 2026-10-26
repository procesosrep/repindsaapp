'use client';
type R=Record<string,any>;
export function ProjectRPPicker({projects,value,disabled,onChange,optional=false}:{projects:R[],value:R,disabled:boolean,onChange:(v:R)=>void,optional?:boolean}){
  function select(id:string){
    const p=projects.find(p=>p.id===id);
    onChange({projectId:p?.id||'',projectName:p?.name||'',serviceReference:p?.rp||''});
  }
  return <>
    <label>Proyecto {optional?'(opcional)':'*'}<select disabled={disabled} aria-label="Proyecto del catálogo activo" value={value.projectId||''} onChange={e=>select(e.target.value)}>
      <option value="">Seleccionar proyecto…</option>
      {projects.map(p=><option key={p.id} value={p.id}>{[p.name,p.clientName].filter(Boolean).join(' - ')}</option>)}
    </select></label>
    <label>RP del servicio {optional?'(opcional)':'*'}<select disabled={disabled} aria-label="RP del catálogo activo" value={value.projectId||''} onChange={e=>select(e.target.value)}>
      <option value="">Seleccionar RP…</option>
      {projects.filter(p=>p.rp).map(p=><option key={p.id} value={p.id}>{p.rp}</option>)}
    </select></label>
    {!value.projectId&&(value.projectName||value.serviceReference)&&<p className="hrHint">Selecciona del catálogo para vincular el proyecto y su RP. Referencia anterior: {value.projectName} · {value.serviceReference}.</p>}
  </>;
}
