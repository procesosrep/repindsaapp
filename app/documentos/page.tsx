'use client';
import {useEffect,useState} from 'react';
import {TransversalWorkspace} from '../transversal-workspace';
import {WorkspaceLoader} from '../workspace-loader';
import {SessionControls} from '../session-controls';
export default function Documentos(){const [data,setData]=useState<any>(null),[error,setError]=useState('');async function load(){try{const r=await fetch('/api/documents-workspace',{cache:'no-store',signal:AbortSignal.timeout(15000)});const d:any=await r.json();if(r.status===401){location.replace('/acceso');return;}if(!r.ok)throw Error(d.error);setData(d);setError('')}catch(e:any){setError(e.message||'No se pudo cargar el visor.')}}useEffect(()=>{load()},[]);return <main className="cajaOnly"><header><img width="150" src="/repindsa-logo.png" alt="REPINDSA"/><h1>Visor de documentos</h1><SessionControls/></header>{error&&<p className="error">{error}</p>}{data?<TransversalWorkspace rows={data.records} role="Visor" onReload={load}/>:!error&&<WorkspaceLoader/>}</main>}
