'use client';
import {useEffect,useState} from 'react';
export function PwaControls(){
 const [offline,setOffline]=useState(false),[waiting,setWaiting]=useState<ServiceWorker|null>(null);
 useEffect(()=>{
  const online=()=>setOffline(!navigator.onLine);online();window.addEventListener('online',online);window.addEventListener('offline',online);
  let alive=true,registration:ServiceWorkerRegistration|undefined;
  const updated=()=>{const worker=registration?.installing;worker?.addEventListener('statechange',()=>{if(alive&&worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(registration?.waiting||null)})};
  if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(r=>{if(!alive)return;registration=r;setWaiting(r.waiting);r.addEventListener('updatefound',updated);r.update().catch(()=>{})}).catch(()=>{});}
  const check=()=>{if(document.visibilityState==='visible')registration?.update().catch(()=>{})};document.addEventListener('visibilitychange',check);
  return()=>{alive=false;window.removeEventListener('online',online);window.removeEventListener('offline',online);document.removeEventListener('visibilitychange',check);registration?.removeEventListener('updatefound',updated)};
 },[]);
 function update(){if(!waiting)return;let reloading=false;const refresh=()=>{if(!reloading){reloading=true;location.reload()}};navigator.serviceWorker.addEventListener('controllerchange',refresh,{once:true});waiting.postMessage({type:'ACTIVATE_UPDATE'});}
 return <>{offline&&<div className="pwaConnection" role="status">Sin conexión. Conéctate antes de enviar cambios.</div>}{waiting&&<section className="pwaUpdate" aria-label="Actualización disponible"><div><b>Hay una actualización disponible</b><small>Guarda tu trabajo en todas las ventanas antes de actualizar.</small></div><button type="button" onClick={update}>Actualizar app</button><button type="button" onClick={()=>setWaiting(null)}>Después</button></section>}</>;
}
