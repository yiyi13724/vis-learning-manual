import {catalogPromise,readState,saveState,recordAnswer,normalizeState,downloadFile,esc,urlFor,installSearch,storageAvailable} from './shared.js';

const catalog=await catalogPromise;
const sections=catalog.flatMap(ch=>ch.sections.map(s=>({ch,s})));
const chapterSelect=document.querySelector('#review-chapter');
chapterSelect.insertAdjacentHTML('beforeend',catalog.map(ch=>`<option value="${ch.number}">第${ch.number}章 · ${esc(ch.title)}</option>`).join(''));
const practice=document.querySelector('#practice');
let filter='due',seen=new Set();
function matches(item,state){
 if(chapterSelect.value!=='all'&&item.ch.number!==+chapterSelect.value)return false;
 const answer=state.answers[item.s.id];
 if(filter==='wrong')return answer?.correct===false;
 if(filter==='new')return !answer;
 if(filter==='due')return answer&&(!answer.correct||!answer.dueAt||answer.dueAt<=Date.now());
 return true;
}
function updateSummary(){
 const state=readState(),answered=sections.filter(x=>state.answers[x.s.id]);
 document.querySelector('#stat-answered').textContent=answered.length;
 document.querySelector('#stat-wrong').textContent=answered.filter(x=>!state.answers[x.s.id].correct).length;
 document.querySelector('#stat-due').textContent=answered.filter(x=>{const a=state.answers[x.s.id];return !a.correct||!a.dueAt||a.dueAt<=Date.now()}).length;
 document.querySelector('#stat-notes').textContent=Object.values(state.notes).filter(v=>v.trim()).length;
 document.querySelector('#chapter-summary').innerHTML='<h3>各章最近答对 / 已练习</h3>'+catalog.map(ch=>{const answers=ch.sections.map(s=>state.answers[s.id]).filter(Boolean),correct=answers.filter(a=>a.correct).length;return `<div class="chapter-performance"><span>${esc(ch.title)}</span><small>${correct} / ${answers.length}</small><progress value="${correct}" max="${Math.max(answers.length,1)}" aria-label="${esc(ch.title)}最近答对 ${correct}，已练习 ${answers.length} 题"></progress></div>`}).join('');
 const notes=sections.filter(x=>state.notes[x.s.id]?.trim());
 document.querySelector('#notes-list').innerHTML=notes.length?notes.map(({ch,s})=>`<article class="note-card"><a href="${urlFor(ch,s)}">${esc(s.title)} ↗</a><p>${esc(state.notes[s.id])}</p></article>`).join(''):'<p class="empty-state">还没有笔记。在章节页打开“我的学习笔记”，写下你的解释和问题。</p>';
 if(!storageAvailable)document.querySelector('#backup-status').textContent='浏览器未允许持久保存，请及时导出本次记录。';
}
function renderQuestion(){
 const state=readState();
 const queue=sections.filter(item=>matches(item,state)&&!seen.has(item.s.id));
 const item=queue[0];
 if(!item){const total=sections.filter(x=>matches(x,state)).length;practice.innerHTML=`<div class="empty-state"><p class="eyebrow">${seen.size?'SESSION COMPLETE':'READY WHEN YOU ARE'}</p><h2>${seen.size?'这一轮练习结束了':'当前范围暂无待复习题目'}</h2><p>${total?'可以再练一轮，或更换章节范围。':'可以选择“尚未练习”开始新题，或选择“全部题目”自由练习。'}</p><button id="restart-review">${total?'再练一轮':'练习全部题目'}</button></div>`;practice.querySelector('button').onclick=()=>{if(!total){filter='all';syncFilters()}seen.clear();renderQuestion()};return;}
 const {ch,s}=item,previous=state.answers[s.id];
 practice.innerHTML=`<div class="question-meta"><span>第 ${ch.number} 章 · ${esc(ch.title)}</span><span>本轮剩余 ${queue.length} 题</span></div><h2>${esc(s.question)}</h2><label class="recall-label" for="recall-draft">先不看选项，用一句话回答</label><textarea id="recall-draft" rows="3" placeholder="先尝试回忆；这里是临时草稿，不会保存。"></textarea><button id="reveal-options" aria-expanded="false">我想好了，展开选项</button><form class="quiz review-quiz" hidden><fieldset><legend>选择你的答案</legend>${s.options.map((opt,i)=>`<label><input type="radio" required name="choice" value="${i}">${esc(opt)}</label>`).join('')}</fieldset><button type="submit">检查并记录</button><div class="quiz-feedback" hidden role="status"></div></form><div class="review-followup" hidden><a href="${urlFor(ch,s)}">回到讲解：${esc(s.title)} ↗</a><button id="next-question" class="primary">下一题 →</button></div>${previous?`<p class="review-hint">上次${previous.correct?'答对':'答错'}${previous.lastAt?' · '+new Date(previous.lastAt).toLocaleDateString('zh-CN'):''}。本次展开选项前不显示上次选择。</p>`:''}`;
 const form=practice.querySelector('form');
 practice.querySelector('#reveal-options').onclick=e=>{form.hidden=false;e.target.hidden=true;e.target.setAttribute('aria-expanded','true');form.querySelector('input').focus()};
 form.onsubmit=e=>{
  e.preventDefault();const choice=Number(new FormData(form).get('choice'));const answer=recordAnswer(s.id,choice,choice===s.answer);seen.add(s.id);
  const feedback=form.querySelector('.quiz-feedback');feedback.hidden=false;feedback.dataset.correct=answer.correct;feedback.textContent=(answer.correct?'回答正确。':'正确答案：'+s.options[s.answer]+'。')+s.explanation+(answer.correct?' 下次建议回顾：'+new Date(answer.dueAt).toLocaleDateString('zh-CN')+'。':' 此题仍保留在“最近错题”中。');
  form.querySelectorAll('input,button').forEach(el=>el.disabled=true);practice.querySelector('.review-followup').hidden=false;updateSummary();
 };
 practice.querySelector('#next-question').onclick=()=>{renderQuestion();const heading=practice.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});practice.scrollIntoView({behavior:'instant',block:'start'})};
}
function syncFilters(){document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===filter))}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;seen.clear();syncFilters();renderQuestion()});
chapterSelect.onchange=()=>{seen.clear();renderQuestion()};
document.querySelector('#export-records').onclick=()=>downloadFile('可视化导论-学习记录.json',JSON.stringify({format:'vis-learning-backup',version:1,exportedAt:new Date().toISOString(),state:readState()},null,2));
document.querySelector('#export-notes').onclick=()=>{
 const state=readState();const notes=sections.filter(x=>state.notes[x.s.id]?.trim());
 if(!notes.length){document.querySelector('#backup-status').textContent='还没有可导出的笔记，请先在章节页记录。';return}
 downloadFile('可视化导论-学习笔记.md','# 可视化导论 · 学习笔记\n\n'+notes.map(({s})=>`## ${s.title}\n\n${state.notes[s.id]}\n`).join('\n'),'text/markdown;charset=utf-8');
};
document.querySelector('#import-records').onchange=async e=>{
 const file=e.target.files[0],message=document.querySelector('#backup-status');if(!file)return;
 try{
  if(file.size>1024*1024)throw Error('备份文件应小于 1 MB。');
  const data=JSON.parse(await file.text());
  if(data.format!=='vis-learning-backup'||data.version!==1||!data.state||!Array.isArray(data.state.done)||!Array.isArray(data.state.bookmarks)||!data.state.answers||typeof data.state.answers!=='object'||Array.isArray(data.state.answers))throw Error('不是有效的可视化导论学习备份。');
  const state=normalizeState(data.state),valid=new Map(sections.map(x=>[x.s.id,x.s]));
  state.done=state.done.filter(id=>valid.has(id));state.bookmarks=state.bookmarks.filter(id=>valid.has(id));if(!valid.has(state.last))state.last=null;
  for(const [id,a] of Object.entries(state.answers)){const s=valid.get(id);if(!s||a.choice>=s.options.length)delete state.answers[id];else a.correct=a.choice===s.answer}
  for(const id of Object.keys(state.notes))if(!valid.has(id))delete state.notes[id];
  if(!confirm(`将恢复 ${Object.keys(state.answers).length} 个小节的答题记录、${Object.keys(state.notes).length} 条笔记，并替换当前浏览器的全部学习记录。继续导入？`)){message.textContent='已取消导入，原记录保持不变。';return}
  saveState(state);seen.clear();updateSummary();renderQuestion();message.textContent=storageAvailable?'导入完成。学习位置、进度、书签、自测和笔记已恢复。':'已导入到本次会话，但浏览器不允许持久保存。';
 }catch(err){message.textContent='导入失败：'+(err instanceof SyntaxError?'文件不是有效的 JSON。':err.message)}finally{e.target.value=''}
};
window.addEventListener('storage',()=>{seen.clear();updateSummary();renderQuestion()});
updateSummary();renderQuestion();installSearch();
