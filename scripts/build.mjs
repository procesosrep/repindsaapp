import {buildProduction} from '../server/build-integrity.mjs';
try{const release=await buildProduction();console.log('[REPINDSA] Compilación verificada: '+release.fingerprint.slice(0,12));}catch(error){console.error('[REPINDSA] '+error.message);process.exitCode=1;}
