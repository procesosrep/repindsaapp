import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {saveBrowserScreenshot} from '../scripts/browser-artifacts.mjs';

test('browser evidence is writable from an arbitrary runner checkout, without /workspace',async()=>{
 const root=await mkdtemp(join(tmpdir(),'repindsa-runner-')),checkout=join(root,'work','repindsaapp'),previous=process.cwd(),configured=process.env.RESPONSIVE_SCREENSHOT_DIR;
 await mkdir(checkout,{recursive:true});
 try{process.chdir(checkout);delete process.env.RESPONSIVE_SCREENSHOT_DIR;let saved;
 await saveBrowserScreenshot({screenshot:async options=>{saved=options;await writeFile(options.path,'test screenshot')}},'movil.png',{fullPage:true});
 assert.equal(saved.path,join(checkout,'.test-artifacts','screenshots','movil.png'));assert.equal(saved.fullPage,true);assert.equal(await readFile(saved.path,'utf8'),'test screenshot');
 }finally{process.chdir(previous);if(configured===undefined)delete process.env.RESPONSIVE_SCREENSHOT_DIR;else process.env.RESPONSIVE_SCREENSHOT_DIR=configured;await rm(root,{recursive:true,force:true})}
});
test('browser evidence honors its configured directory and refuses names outside it',async()=>{
 const root=await mkdtemp(join(tmpdir(),'repindsa-artifacts-')),previous=process.env.RESPONSIVE_SCREENSHOT_DIR;
 try{process.env.RESPONSIVE_SCREENSHOT_DIR=join(root,'screenshots');let saved;
 await saveBrowserScreenshot({screenshot:async options=>{saved=options;await writeFile(options.path,'image')}},'combustible.png');assert.equal(saved.path,join(root,'screenshots','combustible.png'));
 await assert.rejects(saveBrowserScreenshot({screenshot:async()=>{}},'../outside.png'),/sin directorios/);
 }finally{if(previous===undefined)delete process.env.RESPONSIVE_SCREENSHOT_DIR;else process.env.RESPONSIVE_SCREENSHOT_DIR=previous;await rm(root,{recursive:true,force:true})}
});
