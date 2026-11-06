'use client';
import {ProfileButton} from './profile-ui';
import {appVersion} from './version';
import {Menu,LogOut,LogIn} from 'lucide-react';
import {useEffect,useId,useRef,useState} from 'react';
export function SessionControls({authenticated}:{authenticated?:boolean}={}){
 const [local,setLocal]=useState(!!authenticated),[busy,setBusy]=useState(false),[error,setError]=useState(''),[open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),menuId=useId();
 useEffect(()=>{if(authenticated!==undefined){setLocal(authenticated);return}let alive=true;fetch('/api/material-access',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(alive)setLocal(!!d.user)}).catch(()=>{});return()=>{alive=false}},[authenticated]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)},key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key)}},[open]);
 async function logout(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/material-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!r.ok)throw Error();window.location.replace('/acceso')}catch{setError('No se pudo cerrar sesión. Intenta nuevamente.');setBusy(false)}}
 const actions=<>{local&&<ProfileButton/>}<a href="/acceso"><LogIn className="sessionMenuIcon" size={18}/>Mi acceso</a>{local?<button type="button" disabled={busy} onClick={logout}><LogOut className="sessionMenuIcon" size={18}/>{busy?'Cerrando…':'Cerrar sesión'}</button>:<a href="/signout-with-chatgpt?return_to=%2Facceso" target="_top"><LogOut className="sessionMenuIcon" size={18}/>Cerrar sesión</a>}</>;
 return <div className="sessionControls" ref={root}><div className="sessionDesktopActions">{actions}</div><button ref={trigger} type="button" className="sessionMenuToggle" aria-label="Menú de mi cuenta" aria-controls={menuId} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Menu size={24}/></button><nav id={menuId} className="sessionMobileMenu" aria-label="Mi cuenta" hidden={!open} onClick={e=>{if((e.target as HTMLElement).closest('button,a'))setOpen(false)}}>{actions}<small className="sessionMenuVersion">Versión {appVersion}</small></nav>{error&&<small role="alert">{error}</small>}</div>
}
