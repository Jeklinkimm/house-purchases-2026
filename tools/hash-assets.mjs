import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
let html=await readFile('site/index.html','utf8');
for(const [name,extension,attribute] of [['app','js','src'],['style','css','href']]){
 const bytes=await readFile(`site/assets/${name}.${extension}`);
 const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const asset=`assets/${name}.${hash}.${extension}`;
 await writeFile(`site/${asset}`,bytes);
 html=html.replace(new RegExp(`${attribute}="assets/${name}(?:\\.[a-f0-9]{12})?\\.${extension}"`),`${attribute}="${asset}"`);
}
await writeFile('site/index.html',html);
console.log('Versioned CSS and JavaScript assets for deployment.');
