export const base = new URL('../', import.meta.url);
export const catalogPromise = fetch(new URL('catalog.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('目录加载失败');return r.json()});
const key='vis-learning-v1';
let memory={done:[],bookmarks:[],answers:{},notes:{},last:null};
export let storageAvailable=true;
const validId=id=>/^ch-[1-5]-[1-8]$/.test(id);
export function normalizeState(v){
 const result={done:[],bookmarks:[],answers:{},notes:{},last:null};
 if(!v||typeof v!=='object')return result;
 for(const name of ['done','bookmarks'])result[name]=[...new Set((Array.isArray(v[name])?v[name]:[]).filter(x=>typeof x==='string'&&validId(x)))];
 if(typeof v.last==='string'&&validId(v.last))result.last=v.last;
 if(v.answers&&typeof v.answers==='object')for(const [id,a] of Object.entries(v.answers)){
  if(!validId(id)||!a||!Number.isInteger(a.choice)||a.choice<0||a.choice>20||typeof a.correct!=='boolean')continue;
  const num=(n,max)=>Number.isFinite(n)&&n>=0?Math.min(n,max):0;
  result.answers[id]={choice:a.choice,correct:a.correct,attempts:Math.floor(num(a.attempts,100000)),streak:Math.floor(num(a.streak,4)),lastAt:num(a.lastAt,1e13),dueAt:num(a.dueAt,1e13)};
 }
 if(v.notes&&typeof v.notes==='object')for(const [id,note] of Object.entries(v.notes))if(validId(id)&&typeof note==='string')result.notes[id]=note.slice(0,4000);
 return result;
}
export function readState(){if(!storageAvailable)return memory;try{const raw=localStorage.getItem(key);if(raw)memory=normalizeState(JSON.parse(raw));}catch{storageAvailable=false}return memory}
export function saveState(v){memory=normalizeState(v);try{localStorage.setItem(key,JSON.stringify(memory))}catch{storageAvailable=false}window.dispatchEvent(new CustomEvent('course:state'));return memory}
export function resetState(){saveState({done:[],bookmarks:[],answers:{},notes:{},last:null})}
export function recordAnswer(id,choice,correct){
 const state=readState(),previous=state.answers[id],now=Date.now(),day=86400000;
 const sameDay=previous?.correct&&previous.lastAt&&now-previous.lastAt<day;
 const streak=correct?(sameDay?previous.streak||1:Math.min((previous?.streak||0)+1,4)):0;
 const dueAt=correct?(sameDay&&previous.dueAt>now?previous.dueAt:now+[1,3,7,14][streak-1]*day):now;
 state.answers[id]={choice,correct,attempts:(previous?.attempts||0)+1,lastAt:now,streak,dueAt};
 return saveState(state).answers[id];
}
export function downloadFile(name,text,type='application/json'){
 const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function urlFor(ch,s){return new URL(ch.url+(s?'#'+s.id:''),base).href}
export function toast(msg){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),3000)}
export async function installSearch(){
 const dialog=document.createElement('dialog');dialog.className='search-dialog';dialog.setAttribute('aria-label','搜索课程知识点');dialog.innerHTML='<div class="search-head"><label>搜索课程知识点<input type="search" placeholder="例如：比例尺、Data Join、色彩" autocomplete="off"></label><button aria-label="关闭搜索">关闭</button></div><div class="search-results"><p class="search-status" role="status">输入关键词，查找讲解、代码和术语。</p><div class="result-list"></div></div>';document.body.append(dialog);
 const input=dialog.querySelector('input'),list=dialog.querySelector('.result-list'),status=dialog.querySelector('.search-status');
 dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
 document.querySelectorAll('[data-search]').forEach(b=>b.addEventListener('click',()=>{dialog.showModal();input.focus()}));
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();if(!dialog.open){dialog.showModal();input.focus()}}});
 input.addEventListener('input',async()=>{try{const data=await catalogPromise;const query=input.value.trim().toLowerCase();list.replaceChildren();if(!query){status.textContent='输入关键词，查找讲解、代码和术语。';return}const tokens=query.split(/\s+/);const hits=data.flatMap(ch=>ch.sections.map(s=>({ch,s}))).filter(({s})=>tokens.every(t=>(s.title+' '+s.goal+' '+s.text).toLowerCase().includes(t)));status.textContent=hits.length?`找到 ${hits.length} 个相关小节`:'没有找到相关内容，请尝试更短的关键词或英文术语。';for(const {ch,s} of hits){const hay=s.text.toLowerCase(),pos=hay.indexOf(tokens[0]),excerpt=s.text.slice(Math.max(0,pos-35),Math.max(0,pos-35)+130);const a=document.createElement('a');a.className='search-result';a.href=urlFor(ch,s);a.innerHTML=`<strong>${esc(s.title)}</strong><small>${esc(excerpt)}…</small>`;a.onclick=()=>dialog.close();list.append(a)}}catch{status.textContent='搜索目录暂时无法加载，请刷新页面后重试。'}});
}
