import assert from 'node:assert/strict';
// Inspect layout before Playwright can automatically scroll a button into view.
export async function assertDialogScroll(page,dialog,keyboard=true){
 await dialog.waitFor();
 if(await page.evaluate(()=>innerWidth>750))return;
 const controls=dialog.getByRole('button');let last;
 for(let i=await controls.count()-1;i>=0;i--){if(await controls.nth(i).isVisible()){last=controls.nth(i);break;}}
 if(!last)return;
 const layout=await last.evaluate(button=>{const r=button.getBoundingClientRect();const blockers=[];for(let p=button.parentElement;p&&p!==document.body;p=p.parentElement){const style=getComputedStyle(p),b=p.getBoundingClientRect();if(['hidden','clip'].includes(style.overflowY)&&(r.bottom>b.bottom+2||r.top<b.top-2))blockers.push(p.className);if(p.matches('[role=dialog],dialog'))break;}return {blockers}});
 assert.deepEqual(layout.blockers,[],'Action is clipped by a non-scrollable container');
 const scroll=await dialog.evaluate(el=>{const style=getComputedStyle(el),r=el.getBoundingClientRect();return {overflow:style.overflowY,extra:el.scrollHeight-el.clientHeight,top:r.top,bottom:r.bottom,height:visualViewport?.height||innerHeight}});
 if(scroll.extra>2)assert(['auto','scroll'].includes(scroll.overflow),'Long mobile dialog must allow vertical scrolling');
 if(scroll.extra>2){
  await dialog.evaluate(el=>el.scrollTop=0);
  const box=await dialog.boundingBox(),cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const x=Math.max(1,Math.round(box.x+8)),start=Math.min(Math.round(box.bottom||box.y+box.height)-80,Math.round(scroll.height)-80),end=Math.max(Math.round(box.y)+60,start-300);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
  for(let y=start-20;y>=end;y-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(12);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(80);await cdp.detach();assert(await dialog.evaluate(el=>el.scrollTop>0),'Touch gesture must scroll a long mobile dialog');
 }
 // Scroll the real container to its end and prove the final action is reachable.
 await last.evaluate(button=>{for(let p=button.parentElement;p&&p!==document.body;p=p.parentElement){if(['auto','scroll'].includes(getComputedStyle(p).overflowY))p.scrollTop=p.scrollHeight;if(p.matches('[role=dialog],dialog'))break;}});
 const visible=await last.evaluate(button=>{const r=button.getBoundingClientRect(),v=visualViewport;return r.top>=(v?.offsetTop||0)-2&&r.bottom<=(v?.offsetTop||0)+(v?.height||innerHeight)+2;});
 assert(visible,'Final action must fit inside the visible phone viewport after scrolling');
 if(keyboard&&await page.evaluate(()=>innerWidth===390)){
  await page.evaluate(()=>{window.__testViewportDescriptors={height:Object.getOwnPropertyDescriptor(visualViewport,'height'),offsetTop:Object.getOwnPropertyDescriptor(visualViewport,'offsetTop')};Object.defineProperty(visualViewport,'height',{configurable:true,value:320});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:50});visualViewport.dispatchEvent(new Event('resize'));});
  try{await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--dialog-viewport-height')==='320px');await assertDialogScroll(page,dialog,false)}finally{await page.evaluate(()=>{for(const key of ['height','offsetTop']){const descriptor=window.__testViewportDescriptors[key];if(descriptor)Object.defineProperty(visualViewport,key,descriptor);else delete visualViewport[key];}delete window.__testViewportDescriptors;visualViewport.dispatchEvent(new Event('resize'));});await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--dialog-viewport-height')!=='320px');}
 }

}
