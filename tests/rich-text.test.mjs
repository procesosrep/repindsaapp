import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpile(fs.readFileSync('app/rich-text.ts','utf8').replace(/export /g,''),{target:ts.ScriptTarget.ES2022});
const {cleanRichText,textTable,richTextLimit}=new Function(code+';return {cleanRichText,textTable,richTextLimit}')();
test('document formatting preserves tables, merged cells, raster images and alignment safely',()=>{
 const src='data:image/png;base64,iVBORw0KGgo=';
 const body='<h2>Título</h2><table><tbody><tr><td colspan="2" onclick="evil()">Dato</td></tr></tbody></table><p style="text-align:center;color:red">Texto</p><img src="'+src+'" onerror="evil()">';
 const safe=cleanRichText(body);assert.match(safe,/<td colspan="2">Dato/);assert.match(safe,/<table>/);assert.match(safe,/style="text-align:center"/);assert.match(safe,/<img src="data:image\/png;base64,/);assert.doesNotMatch(safe,/onclick|onerror|color:red/);assert.equal(cleanRichText(safe),safe);assert(safe.length<richTextLimit);
});
test('pasted active content and remote image tracking cannot survive document sanitization',()=>{
 const safe=cleanRichText('<script>alert(1)</script><svg><script>x</script></svg><iframe src="https://evil"></iframe><img src="javascript:alert(1)"><img src="https://evil/track"><img src="data:image/svg+xml;base64,AAAA"><p style="background:url(javascript:x);text-align:right" onmouseover="x">OK</p>');assert.equal(safe,'<p style="text-align:right">OK</p>');assert.equal(cleanRichText('<img src="data:image/png;base64,'+'A'.repeat(350000)+'">'),'');
});
test('Excel tab-separated clipboard creates escaped, bounded editable table cells',()=>{
 const result=textTable('Artículo\tCantidad\r\n<bomba>\t2');assert.match(result,/<td>Artículo<\/td><td>Cantidad<\/td>/);assert.match(result,/&lt;bomba&gt;/);assert.equal(cleanRichText(result),result);assert.throws(()=>textTable(Array(150).fill('a\tb').join('\n')),/100 filas/);
});

test('resized image dimensions persist while unsafe dimensions are stripped',()=>{const img='<img src="data:image/png;base64,iVBORw0KGgo="';assert.match(cleanRichText(img+' width="240">'),/width="240"/);assert.doesNotMatch(cleanRichText(img+' width="9999999" style="width:expression(evil())">'),/width|style/)});
