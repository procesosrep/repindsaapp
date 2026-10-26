import fs from 'node:fs';import ts from 'typescript';import assert from 'node:assert/strict';
const code=ts.transpile(fs.readFileSync('app/flight-search.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});const freeFlightSearch=new Function(code+';return freeFlightSearch')();
const base={origin:'Monterrey',destination:'Veracruz',travelDate:'2026-11-03',passengers:1,name:'PRIVATE_PERSON',birthDate:'PRIVATE_DOB'};
const u=new URL(freeFlightSearch(base));assert.equal(u.origin,'https://www.google.com');assert.equal(u.pathname,'/travel/flights');assert.equal(u.searchParams.get('curr'),'MXN');assert.equal(u.searchParams.get('gl'),'MX');assert.match(u.searchParams.get('q'),/one way/);assert.ok(!u.href.includes('PRIVATE'));assert.ok(!u.href.includes('api_key'));
const round=new URL(freeFlightSearch({...base,returnDate:'2026-11-10',passengers:2},'Volaris'));assert.match(round.searchParams.get('q'),/returning 2026-11-10 for 2 adults economy Volaris/);
for(const change of [{origin:''},{destination:''},{origin:'Veracruz'},{travelDate:'2026-02-30'},{returnDate:'2026-01-01'},{passengers:0},{passengers:1.5}])assert.throws(()=>freeFlightSearch({...base,...change}));
assert.throws(()=>freeFlightSearch(base,'https://evil.test'));
const encoded=new URL(freeFlightSearch({...base,origin:'México & Co',destination:'Nueva York #1'}));assert.ok(encoded.searchParams.get('q').includes('México & Co'));assert.equal([...encoded.searchParams].length,4);
console.log('Free flight search passed: route, dates, passengers, MXN, safe URLs, no personal data and no paid API.');
