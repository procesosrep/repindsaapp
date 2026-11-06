'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,RefreshCw} from 'lucide-react';
import {TicketWorkspace} from './ticket-workspace';
type R=Record<string,any>;
export function TravelTicketsWorkspace({onBack}:{onBack:()=>void}){const [data,setData]=useState<R|null>(null),[error,setError]=useState('');async function load(){const res=await fetch('/api/tickets',{cache:'no-store'}),result=await res.json();if(!res.ok)throw Error(result.error||'No se pudieron cargar los boletos.');setData(result);setError('')}useEffect(()=>{load().catch(e=>setError(e.message))},[]);return <section className="travelTicketsWorkspace"><div className="toolbar"><button type="button" onClick={onBack}><ArrowLeft size={18}/>Volver a Viáticos</button><button type="button" onClick={()=>load().catch(e=>setError(e.message))}><RefreshCw size={18}/>Actualizar boletos</button></div>{error&&<p className="error" role="alert">{error}</p>}{data?<TicketWorkspace rows={data.records} role={data.user.role} permissions={data.permissions} identity={data.user.email} initialCreate={data.permissions.requestTickets} onReload={load}/>:!error&&<p>Cargando boletos…</p>}</section>}
