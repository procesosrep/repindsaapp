import {mkdir} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';

// Work inside the checkout on GitHub runners and local workspaces alike.
export async function saveBrowserScreenshot(page,name,options={}){
 if(!name||basename(name)!==name)throw Error('El nombre de la captura debe ser un archivo, sin directorios.');
 const directory=resolve(process.env.RESPONSIVE_SCREENSHOT_DIR||'.test-artifacts/screenshots');
 await mkdir(directory,{recursive:true});
 await page.screenshot({...options,path:join(directory,name)});
}
