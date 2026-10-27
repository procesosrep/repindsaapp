export const richTextLimit=1000000;
export function cleanRichText(value:string){return String(value||'').replace(/<(script|style|iframe|object|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,(tag,name)=>{
 const n=name.toLowerCase(),closing=tag.startsWith('</');
 if(n==='img'){if(closing)return '';const src=tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];return src&&/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/]+=*$/i.test(src)&&src.length<=350000?'<img src="'+src+'" alt="Imagen del documento">':'';}
 if(!['p','br','b','strong','i','em','u','ul','ol','li','h2','h3','h4','blockquote','div','span','table','thead','tbody','tfoot','tr','td','th','caption'].includes(n))return '';
 let attrs='';if(!closing){const style=tag.match(/\bstyle\s*=\s*(["'])(.*?)\1/i)?.[2]||'',align=style.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i)?.[1];if(align)attrs+=' style="text-align:'+align.toLowerCase()+'"';}if(!closing&&['td','th'].includes(n))for(const attr of ['colspan','rowspan']){const v=tag.match(new RegExp('\\b'+attr+'\\s*=\\s*(?:["\\\']([0-9]+)["\\\']|([0-9]+))','i'));const count=Number(v?.[1]||v?.[2]);if(count>1&&count<=100)attrs+=' '+attr+'="'+count+'"';}
 return (closing?'</':'<')+n+attrs+'>';
 });}
export function textTable(value:string){const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));const rows=value.replace(/\r?\n$/,'').split(/\r?\n/);if(rows.length>100||rows.some(row=>row.split('\t').length>30))throw Error('Pega hasta 100 filas y 30 columnas a la vez.');return '<table><tbody>'+rows.map(row=>'<tr>'+row.split('\t').map(cell=>'<td>'+escape(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table><p><br></p>';}
