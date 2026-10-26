type R=Record<string,any>;
export async function uploadQuoteFile(quoteId:string,file:File,onProgress?:(s:string)=>void):Promise<R>{
 if(file.size>10*1024*1024)throw Error('El archivo debe pesar como máximo 10 MB.');
 const upload=async(f:File)=>{const form=new FormData();form.set('file',f);form.set('quoteId',quoteId);const response=await fetch('/api/quote-assets',{method:'POST',body:form});const value:any=await response.json();if(!response.ok)throw Error(value.error||'No se pudo cargar el archivo.');return value;};
 // Render each PDF page so the annex is part of the printed proposal, not an iframe or an external link.
 if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
  onProgress?.('Preparando PDF…');const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs?v=5.4.624';
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,isEvalSupported:false});
  let pdf;try{pdf=await task.promise;}catch{await task.destroy();throw Error('No se pudo leer el PDF. Revisa que no esté protegido con contraseña.');}
  const pages:R[]=[];try{for(let n=1;n<=pdf.numPages;n++){onProgress?.(`Preparando página ${n} de ${pdf.numPages}…`);const page=await pdf.getPage(n);const original=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,1800/Math.max(original.width,original.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const context=canvas.getContext('2d');if(!context)throw Error('No se pudo preparar la imagen del PDF.');await page.render({canvas,canvasContext:context,viewport,background:'#ffffff'}).promise;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo preparar la página.')),'image/jpeg',0.92));const asset=await upload(new File([blob],`anexo-pagina-${n}.jpg`,{type:'image/jpeg'}));pages.push({id:asset.id,url:asset.url,page:n});canvas.width=0;canvas.height=0;page.cleanup();}const original=await upload(file);return {...original,pages};}finally{await task.destroy();}
 }
 onProgress?.('Cargando imagen…');return upload(file);
}
