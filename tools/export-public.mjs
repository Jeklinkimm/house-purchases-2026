import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const [input,output='site/data/purchases.json']=process.argv.slice(2);
if(!input)throw new Error('Usage: node tools/export-public.mjs <private-input.json> [public-output.json]');
const data=JSON.parse(await readFile(input,'utf8'));
if(!Array.isArray(data.items)||!Array.isArray(data.history))throw new Error('구매 노트 목록/이력 형식이 아닙니다.');
const fields=['id','title','label','category','brand','store','url','quantity','quantityLabel','unitPrice','quotedTotal','priceNote','option','decision','status','sourceDate','rank','orderDate','expectedDate','deliveredDate','paidAmount','shippingPaid','updatedAt'];
const allowedChanges=['status','quantity','option','orderDate','expectedDate','deliveredDate','paidAmount','shippingPaid'];
// 2026-10-21: Only the living-room LED is a Coupang purchase target.
const visibleItems=data.items.filter(p=>p.store!=='쿠팡'||p.id==='living-led');
const visibleIds=new Set(visibleItems.map(p=>p.id));
const items=visibleItems.map(p=>{const x=Object.fromEntries(fields.map(k=>[k,p[k]??null]));x.image=p.image?.startsWith('/products/')?'assets'+p.image:'';return x;});
const history=data.history.filter(e=>visibleIds.has(e.itemId)).map(e=>({id:e.id,itemId:e.itemId,title:e.title,at:e.at,initial:String(e.id).startsWith('initial-'),changes:(e.changes??[]).filter(c=>allowedChanges.includes(c.field)).map(c=>({field:c.field,before:c.before,after:c.after}))})).filter(e=>e.initial||e.changes.length);
const orderChecks=Object.fromEntries(['ohou','coupang'].map(k=>{const c=data.orderChecks?.[k];return [k,c?{at:c.at,scope:c.scope,result:c.result,matched:Number(c.matched)}:null]}));
const checkEvents=Object.entries(orderChecks).filter(([,c])=>c).map(([store,c])=>({id:'check-'+store+'-'+c.at,kind:'check',title:(store==='ohou'?'오늘의집':'쿠팡')+' 주문내역 확인',at:c.at,initial:false,changes:[],result:c.result,scope:c.scope}));
const safe={items,history:[...history,...checkEvents],sourceDate:data.sourceDate,publishedAt:new Date().toISOString(),orderChecks};
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(safe,null,2)+'\n');
console.log(`Public snapshot: ${items.length} items, ${safe.history.length} events`);
