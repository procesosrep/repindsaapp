'use client';
import {useEffect,useState,type InputHTMLAttributes} from 'react';
import {Eye,EyeOff} from 'lucide-react';
export function PasswordInput(props:InputHTMLAttributes<HTMLInputElement>){const [visible,setVisible]=useState(false);useEffect(()=>setVisible(false),[props.autoComplete]);const name=String(props['aria-label']||'Contraseña').toLowerCase();return <span className="passwordField"><input {...props} type={visible?'text':'password'}/><button type="button" className="passwordVisibility" aria-label={(visible?'Ocultar ':'Mostrar ')+name} aria-pressed={visible} title={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={20} aria-hidden="true"/>:<Eye size={20} aria-hidden="true"/>}</button></span>}
