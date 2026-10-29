import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
const root=join(process.cwd(),'public','assets')
const found=[]
function walk(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(glb|gltf)$/i.test(e.name))found.push('/assets/'+relative(root,p).split(sep).join('/'))}}
walk(root)
mkdirSync(join(process.cwd(),'src','generated'),{recursive:true})
writeFileSync(join(process.cwd(),'src','generated','merch-models.json'),JSON.stringify(found.sort(),null,2)+'\n')
console.log('3D assets discovered:',found.length,found.join(', '))
