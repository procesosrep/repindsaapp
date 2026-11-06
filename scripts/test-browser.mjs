import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';

// CI installs the browser revision matching playwright-core. Prefer it over an
// unrelated system Chromium; CHROMIUM_PATH remains an explicit local override.
export function testBrowserOptions({env=process.env,exists=existsSync,managedPath=chromium.executablePath()}={}){
 if(env.CI&&env.CI!=='false'&&!env.CHROMIUM_PATH&&!exists(managedPath))throw Error('CI requiere el Chromium de Playwright. Ejecuta npx playwright-core install --with-deps chromium.');
 const executablePath=env.CHROMIUM_PATH||(exists(managedPath)?managedPath:'/usr/bin/chromium');
 if(!exists(executablePath))throw Error('Chromium no está disponible. Ejecuta npx playwright-core install --with-deps chromium o configura CHROMIUM_PATH.');
 return {executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']};
}
export async function launchTestBrowser(){const options=testBrowserOptions(),browser=await chromium.launch(options);if(process.env.CI)console.log('Chromium de pruebas: '+browser.version()+' · '+options.executablePath);return browser;}
