import {safeImageUrl} from './quote-presentation';
type R=Record<string,any>;
const esc=(v:any)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function supportMediaHTML(value:R,origin=''){
 return (value.images||[]).filter((i:R)=>safeImageUrl(i.url)).map((i:R)=>`<figure class="figure"><div class="imageframe"><img src="${origin}${esc(i.url)}" style="object-fit:${i.fit==='cover'?'cover':'contain'}" alt="${esc(i.caption||'Imagen del alcance')}"></div><figcaption>${esc(i.caption||'')}</figcaption></figure>`).join('')+(value.annexes||[]).map((a:R)=>`<div class="inlineAnnex"><h3>Anexo · ${esc(a.name)}</h3>${(a.pages||[]).filter((p:R)=>safeImageUrl(p.url)).map((p:R,n:number)=>`<figure class="annexPage"><figcaption>${esc(a.name)} · Página ${n+1} de ${a.pages.length}</figcaption><img src="${origin}${esc(p.url)}" alt="Página ${n+1} del anexo ${esc(a.name)}"></figure>`).join('')}</div>`).join('');
}
export function scopedSupportHTML(q:R,origin=''){
 const scoped=[...(q.structure||[]).filter((s:R)=>(s.images||[]).length||(s.annexes||[]).length),...(q.items||[]).filter((s:R)=>(s.images||[]).length||(s.annexes||[]).length)];
 return scoped.length?`<div class="scopedSupport" id="scope-support"><h2>Documentación del alcance</h2>${scoped.map((s:R,n:number)=>`<section id="scope-support-${n}"><h3>${esc([s.system,s.subsystem,s.description].filter(Boolean).join(' / '))}</h3>${supportMediaHTML(s,origin)}</section>`).join('')}</div>`:'';
}
