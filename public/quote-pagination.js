(async function(){
const toolbar=document.querySelector('.printbar');
const button=toolbar.querySelector('button');
const status=toolbar.querySelector('[role="status"]');
toolbar.remove();
try{
 await document.fonts.ready;
 await Promise.all(Array.from(document.images).map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve})));
 await window.PagedPolyfill.preview();
 const layout=document.createElement('style');layout.textContent='.pagedjs_page{position:relative}@media screen{body{background:#e8edf3}.pagedjs_pages{display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px 0}.pagedjs_page{background:white;box-shadow:0 2px 20px #ccd3df}.printbar{position:sticky;top:0;z-index:10000;margin:0}}';document.head.appendChild(layout);
 const pages=Array.from(document.querySelectorAll('.pagedjs_page'));
 pages.forEach((page,index)=>{const footer=document.createElement('div');footer.className='pageNumber';footer.textContent=(index+1)+' de '+pages.length;page.appendChild(footer)});
 document.querySelectorAll('.pagedjs_pages .proposalIndex a').forEach(link=>{const target=document.querySelector(link.getAttribute('href'));const page=target&&target.closest('.pagedjs_page');if(!page)throw new Error('Entrada del índice sin página');link.setAttribute('aria-label',link.textContent+', página '+page.getAttribute('data-page-number'))});
 status.textContent=pages.length+' páginas · Lista para imprimir';
 button.disabled=false;
 document.documentElement.dataset.pagination='ready';
}catch(error){status.textContent='No fue posible preparar las páginas. Recarga esta ventana para intentar de nuevo.';document.documentElement.dataset.pagination='error';console.error(error)}
document.body.prepend(toolbar);
})();
