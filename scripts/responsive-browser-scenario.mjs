import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
export async function exerciseResponsiveUI(baseURL){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let authenticated=true;
  const user={username:'mobile-user',name:'Responsable de materiales',role:'Supervisor',system:'materiales',mustChange:false,rights:{materials:true,requestMaterials:true},features:{public:{}},systems:['materiales']};
  const project={id:'project-mobile',name:'Proyecto con nombre extenso para comprobar dispositivos pequeños',rp:'RP-123-26',status:'En ejecución'};
  const catalog=[{id:'article-mobile',name:'Bomba',description:'Bomba de agua',category:'Materiales',type:'Material',unit:'Pieza',status:'Activo'}];
  const draft={id:'draft-mobile',kind:'materialRequest',status:'Borrador',folio:'RP-SM-2026-00001',revision:1,projectId:project.id,projectName:project.name,serviceReference:project.rp,requester:user.name,requesterId:'local:'+user.username,createdBy:'usuario:'+user.username,createdById:'local:'+user.username,requestDate:'2026-10-27',lines:[],evidence:[]};
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let body={};if(path==='/api/material-access')body={user:authenticated?user:null};else if(path==='/api/material-workspace')body={user,records:[draft],projects:[project],catalog,types:['Material'],units:['Pieza'],receiptBlocks:[]};else if(path==='/api/support')body={notifications:[]};else if(path==='/api/documents-workspace')body={records:[{id:'doc1',kind:'controlledDocument',name:'Política',type:'Política',status:'Vigente',body:'<p>Documento</p>',version:1}]};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  const fits=async label=>{const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(size.scroll<=size.width+1,label+': horizontal overflow '+JSON.stringify(size))};
  for(const [width,height] of [[320,640],[375,667],[390,844],[667,375],[768,1024],[1024,768],[1440,900]]){
   await page.setViewportSize({width,height});authenticated=false;await page.goto(baseURL+'/acceso');await page.getByRole('heading',{name:'Iniciar sesión'}).waitFor();await fits('login '+width);
   authenticated=true;await page.goto(baseURL+'/materiales');await page.getByText(draft.folio,{exact:true}).waitFor();await fits('workspace '+width);if(width===390&&process.env.RESPONSIVE_SCREENSHOT_DIR){await mkdir(process.env.RESPONSIVE_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.RESPONSIVE_SCREENSHOT_DIR,'materiales-mobile.png'),fullPage:true})}
   if(width<=750){const nav=page.getByRole('navigation',{name:'Navegación de Materiales'});await nav.waitFor();const rect=await nav.boundingBox();assert(rect.y+rect.height<=height+1);await nav.getByRole('button',{name:'Mi cuenta'}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).waitFor();}
   await page.getByRole('button',{name:'Nueva solicitud',exact:true}).first().click();const dialog=page.getByRole('dialog',{name:'Nueva solicitud',exact:true});await dialog.waitFor();await fits('composer '+width);
   await dialog.getByLabel('Proyecto del catálogo activo').selectOption(project.id);await dialog.getByRole('button',{name:'Siguiente: categorías'}).click();await dialog.locator('.materialSelection').waitFor();await fits('categories '+width);
   const footer=dialog.locator('footer');await footer.scrollIntoViewIfNeeded();const buttons=footer.getByRole('button');for(let i=0;i<await buttons.count();i++){const rect=await buttons.nth(i).boundingBox();assert(rect.width>0&&rect.x>=-1&&rect.x+rect.width<=width+1,'footer button width '+width)}await dialog.getByRole('button',{name:'Cerrar',exact:true}).first().click();
   await page.goto(baseURL+'/documentos');await page.getByRole('button',{name:'Abrir',exact:true}).click();await fits('documents '+width);await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  }
  assert.deepEqual(errors,[]);console.log('Responsive browser passed: login, Materials list, mobile navigation/account menu, request form/categories/actions and documents at 320, 375, 390, 667 landscape, 768, 1024 and 1440 px. API data mocked; real MySQL concurrency is tested separately.');
 }finally{await browser.close()}
}
