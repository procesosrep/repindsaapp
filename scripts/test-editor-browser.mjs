import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {chromium} from 'playwright-core';
const require=createRequire(import.meta.url),{webpack}=require('next/dist/compiled/webpack/webpack');
const root=process.cwd(),directory=await fs.mkdtemp(path.join(os.tmpdir(),'repindsa-editor-'));
let browser,server;
try{
 for(const name of ['text-editor','rich-text']){
  const source=await fs.readFile(path.join(root,'app',name+(name==='text-editor'?'.tsx':'.ts')),'utf8');
  await fs.writeFile(path.join(directory,name+'.js'),ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}));
 }
 await fs.writeFile(path.join(directory,'entry.js'),`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {TextEditor} from './text-editor';function App(){const [value,setValue]=useState(localStorage.getItem('document')||'<p>Texto inicial</p>');return React.createElement(React.Fragment,null,React.createElement(TextEditor,{value,onChange:setValue}),React.createElement('button',{onClick:()=>localStorage.setItem('document',value)},'Guardar prueba'),React.createElement('output',{id:'stored'},value))}createRoot(document.getElementById('root')).render(React.createElement(App));`);
 const compiler=webpack({mode:'development',devtool:false,entry:path.join(directory,'entry.js'),output:{path:directory,filename:'bundle.js'},module:{rules:[{test:/\.js$/,resolve:{fullySpecified:false}}]},resolve:{modules:[path.join(root,'node_modules'),'node_modules']}});
 await new Promise((resolve,reject)=>compiler.run((error,stats)=>compiler.close(()=>error?reject(error):stats.hasErrors()?reject(Error(stats.toString({all:false,errors:true}))):resolve())));
 const bundle=await fs.readFile(path.join(directory,'bundle.js'));
 server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle:'<!doctype html><html lang="es"><body><div id="root"></div><script src="/bundle.js"></script></body></html>')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url);await page.getByRole('textbox').waitFor();
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=50;c.height=30;c.getContext('2d').fillRect(0,0,50,30);return c.toDataURL('image/png').split(',')[1]});
 // File picker insertion before the user ever focuses the editor.
 await page.locator('input[type=file]').setInputFiles({name:'prueba.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>document.querySelectorAll('[contenteditable] img').length===1);
 await page.waitForFunction(()=>document.querySelector('[contenteditable] img').naturalWidth>0);
 assert.match(await page.locator('#stored').textContent(),/Texto inicial/);
 // Image paste after placing the caret in the document.
 await page.getByRole('textbox').click();
 await page.evaluate(data=>{const binary=atob(data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),clipboard=new DataTransfer();clipboard.items.add(new File([bytes],'pegada.png',{type:'image/png'}));document.querySelector('[contenteditable]').dispatchEvent(new ClipboardEvent('paste',{clipboardData:clipboard,bubbles:true,cancelable:true}));},png);
 await page.waitForFunction(()=>document.querySelectorAll('[contenteditable] img').length===2);
 // Exercise the Range fallback used when execCommand refuses insertion.
 await page.evaluate(()=>{document.execCommand=()=>false});
 await page.locator('input[type=file]').setInputFiles({name:'fallback.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>document.querySelectorAll('[contenteditable] img').length===3);
 await page.getByText('Guardar prueba',{exact:true}).click();await page.reload();
 await page.waitForFunction(()=>document.querySelectorAll('[contenteditable] img').length===3);
 assert.equal(await page.getByRole('textbox').getAttribute('lang'),'es-MX');
 assert.match(await page.locator('#stored').textContent(),/Texto inicial/);assert.deepEqual(errors,[]);
 console.log('Browser editor passed: file insertion without focus, clipboard image, execCommand fallback, decoded images, and three images preserved after save/reload.');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true,force:true});}
