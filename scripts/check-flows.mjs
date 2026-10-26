import {readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
for(const file of readdirSync('scripts').filter(f=>f.startsWith('check-')&&f.endsWith('.mjs')&&f!=='check-flows.mjs').sort()){const r=spawnSync(process.execPath,['scripts/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
