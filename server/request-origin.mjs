// Reverse proxies may expose a preview URL different from APP_ORIGIN. Browsers
// set Sec-Fetch-Site themselves; cross-site JavaScript cannot forge this header.
// Normalize only a valid, browser-confirmed same-origin request, keeping the
// existing route-level origin checks and not granting cross-origin/CORS access.
export function normalizePreviewOrigin(headers, canonicalOrigin, {dev=false}={}) {
  const received=headers.origin;
  if(!received||received===canonicalOrigin)return false;
  if(headers['sec-fetch-site']!=='same-origin'||typeof received!=='string')return false;
  let parsed;
  try {parsed=new URL(received);}catch{return false;}
  if(parsed.origin!==received||parsed.username||parsed.password||
     parsed.protocol!=='https:'&&!(dev&&parsed.protocol==='http:'))return false;
  headers.origin=canonicalOrigin;
  return true;
}
