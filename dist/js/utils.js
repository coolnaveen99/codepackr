export function showToast(msg,type=''){
 let t=document.getElementById('_toast');
 if(!t){
 t=document.createElement('div');
 t.id='_toast';
 t.className='toast';
 document.body.appendChild(t);
}
 t.textContent=msg;
 t.className='toast'+(type?' t-'+type:'');
 t.classList.add('show');
 clearTimeout(t._tid);
 t._tid=setTimeout(()=>t.classList.remove('show'),2400);
}
export async function copyText(text){
 try{
 await navigator.clipboard.writeText(text);
 showToast('Copied to clipboard!','ok');
}catch{
 showToast('Press Ctrl+C to copy','');
}
}
export function downloadText(text,filename){
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));
 a.download=filename;
 a.click();
 showToast('Downloaded:'+filename,'ok');
}
export function readFile(input,cb){
 const file=input.files[0];
 if(!file)return;
 const reader=new FileReader();
 reader.onload=e=>cb(e.target.result,file.name);
 reader.readAsText(file);
 input.value='';
}
export function escHtml(s){
 return String(s)
 .replace(/&/g,'&amp;')
 .replace(/</g,'&lt;')
 .replace(/>/g,'&gt;')
 .replace(/"/g,'&quot;');
}
export function setStatus(el,msg,type){
 if(!el)return;
 el.className='status-bar status-'+type;
 el.innerHTML=(type==='valid'?'✓ ':type==='invalid'?'✗ ':'ℹ ')+escHtml(msg);
 el.style.display='flex';
}
export function injectNavigation(activePage){
 const pages=[
{href:'../pages/json-formatter.html',label:'JSON'},
{href:'../pages/diff-checker.html',label:'Diff'},
{href:'../pages/html-formatter.html',label:'HTML'},
{href:'../pages/base64.html',label:'Base64'},
{href:'../pages/url-encode.html',label:'URL'},
{href:'../pages/regex-tester.html',label:'Regex'},
{href:'../pages/hash-generator.html',label:'Hash'},
{href:'../pages/uuid-generator.html',label:'UUID'},
{href:'../pages/lorem-ipsum.html',label:'Lorem'},
{href:'../pages/markdown.html',label:'MD'},
 ];
 const nav=document.getElementById('toolNav');
 if(!nav)return;
 nav.innerHTML=pages.map(p=>
 `<a href="${p.href}" class="tab${p.label===activePage?' active':''}">${p.label}</a>`
).join('');
}