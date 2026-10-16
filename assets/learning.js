import {catalogPromise,readState,saveState,recordAnswer,esc,urlFor,installSearch,toast,storageAvailable} from './shared.js';
const catalog=await catalogPromise;
const number=+document.querySelector('.course-topbar').dataset.current;
const course=catalog.find(x=>x.number===number);
const all=catalog.flatMap(ch=>ch.sections.map(s=>({ch,s})));
const topbar=document.querySelector('.course-topbar');
const search=document.createElement('button');search.textContent='搜索知识点';search.dataset.search='';search.className='side-search';
const sidebar=document.querySelector('.chapter-nav');sidebar.prepend(search);
const mobile=document.createElement('button');mobile.textContent='本章目录 · 展开 / 收起';mobile.className='mobile-toc';mobile.setAttribute('aria-expanded','false');mobile.onclick=()=>{const open=sidebar.classList.toggle('toc-open');mobile.setAttribute('aria-expanded',open)};sidebar.prepend(mobile);
const progress=document.createElement('div');progress.className='side-progress';sidebar.querySelector('h3').after(progress);
const recap=document.createElement('details');recap.className='chapter-recap';recap.innerHTML=`<summary>本章回顾与复习清单</summary><p>能够用自己的话解释以下问题，再尝试独立修改案例。</p>${course.sections.map(s=>`<a href="#${s.id}">${esc(s.goal)}</a>`).join('')}`;sidebar.append(recap);
const lab=document.createElement('a');lab.href=new URL('../lab/',location.href).href;lab.textContent='交互实验室 ↗';lab.className='secondary';lab.style.cssText='font-size:12px;padding:5px 10px';topbar.append(lab);
const review=document.createElement('a');review.href=new URL('../review/',location.href).href;review.textContent='复习中心';review.className='secondary';review.style.cssText='font-size:12px;padding:5px 10px';topbar.append(review);
// Correct chapter highlighting independently of duplicated bilingual menu entries.
function highlightMenu(){topbar.querySelectorAll('.tabs a').forEach(a=>a.classList.toggle('current',new URL(a.href).pathname===location.pathname))}highlightMenu();document.addEventListener('wbl:localechange',highlightMenu);
const skip=document.createElement('a');skip.className='skip';skip.href='#study-content';skip.textContent='跳到学习内容';document.body.prepend(skip);document.querySelector('.chapter-content').id='study-content';
function refresh(){const st=readState();progress.innerHTML=`<span>本章已标记学完 ${course.sections.filter(s=>st.done.includes(s.id)).length} / ${course.sections.length}</span><progress max="${course.sections.length}" value="${course.sections.filter(s=>st.done.includes(s.id)).length}" aria-label="本章完成进度"></progress>${storageAvailable?'':'<p>记录暂不能保存到本机。</p>'}`;for(const s of course.sections){const article=document.getElementById(s.id);article.querySelector('.bookmark-button').textContent=st.bookmarks.includes(s.id)?'已收藏 ★':'收藏本节 ☆';article.querySelector('.bookmark-button').setAttribute('aria-pressed',st.bookmarks.includes(s.id));article.querySelector('.complete-button').textContent=st.done.includes(s.id)?'已学完 ✓ · 撤销':'标记本节学完';article.querySelector('.complete-button').setAttribute('aria-pressed',st.done.includes(s.id));sidebar.querySelector(`[data-chapter="${s.id}"]`).dataset.done=st.done.includes(s.id)}}
for(const section of course.sections){
 const article=document.getElementById(section.id);
 const goal=document.createElement('div');goal.className='learning-goal';goal.innerHTML=`<small>本节学习目标</small>${esc(section.goal)}`;
 const tools=document.createElement('div');tools.className='section-tools';tools.innerHTML='<button class="compare-button" aria-pressed="false">对照学习</button><button class="bookmark-button" aria-pressed="false">收藏本节 ☆</button><button class="share-button">复制本节链接</button><button class="print-button">打印本节</button>';
 const tabs=article.querySelector('.tabs');tabs.before(goal,tools);
 tools.querySelector('.compare-button').onclick=()=>{const active=article.classList.toggle('compare');tools.querySelector('.compare-button').setAttribute('aria-pressed',active);if(active)article.querySelectorAll('.demo-mount, [id^="demo-mount-"]').forEach(m=>window.renderCourseDemo?.(m))};
 tools.querySelector('.bookmark-button').onclick=()=>{const st=readState();st.bookmarks=st.bookmarks.includes(section.id)?st.bookmarks.filter(id=>id!==section.id):[...st.bookmarks,section.id];saveState(st);refresh()};
 tools.querySelector('.share-button').onclick=async()=>{try{await navigator.clipboard.writeText(urlFor(course,section));toast('本节链接已复制')}catch{toast('未能复制，请复制地址栏中的本节链接')}};
 tools.querySelector('.print-button').onclick=()=>window.print();
 const quiz=document.createElement('section');quiz.className='quiz';quiz.setAttribute('aria-label','本节自测');quiz.innerHTML=`<h3>检查一下，你理解了吗？</h3><form><fieldset><legend>${esc(section.question)}</legend>${section.options.map((opt,i)=>`<label><input required type="radio" name="${section.id}-answer" value="${i}">${esc(opt)}</label>`).join('')}</fieldset><button type="submit">检查答案</button><p class="quiz-feedback" role="status" hidden></p></form>`;article.append(quiz);
 const form=quiz.querySelector('form'),feedback=quiz.querySelector('.quiz-feedback');
 function showAnswer(value){feedback.hidden=false;feedback.dataset.correct=value===section.answer;feedback.textContent=(value===section.answer?'回答正确。':'再想一想。正确答案：'+section.options[section.answer]+'。')+section.explanation}
 const saved=readState().answers[section.id];if(saved&&Number.isInteger(saved.choice)&&section.options[saved.choice]!==undefined){form.querySelector(`[value="${saved.choice}"]`).checked=true;showAnswer(saved.choice)}
 form.onsubmit=e=>{e.preventDefault();const choice=Number(new FormData(form).get(section.id+'-answer'));recordAnswer(section.id,choice,choice===section.answer);showAnswer(choice)};
 const notes=document.createElement('details');notes.className='section-notes';notes.innerHTML=`<summary>用自己的话解释：我的学习笔记</summary><label for="note-${section.id}">不看讲义，写下本节原理、实验观察，或还没想明白的问题。</label><textarea id="note-${section.id}" maxlength="4000" rows="4" placeholder="例如：改变这个参数后，图形为什么会变化？"></textarea><p role="status">仅保存在当前浏览器，可在复习中心导出备份。</p>`;article.append(notes);
 const textarea=notes.querySelector('textarea');textarea.value=readState().notes[section.id]||'';textarea.addEventListener('input',()=>{const state=readState();state.notes[section.id]=textarea.value;saveState(state);notes.querySelector('p').textContent=storageAvailable?'笔记已保存到当前浏览器。':'当前浏览器无法保存，请复制笔记到其他位置。'});
 const index=all.findIndex(x=>x.s.id===section.id),prev=all[index-1],next=all[index+1];
 const pager=document.createElement('div');pager.className='section-pager';pager.innerHTML=`${prev?`<a href="${urlFor(prev.ch,prev.s)}">← 上一节</a>`:'<span>课程起点</span>'}<button class="complete-button" aria-pressed="false">标记本节学完</button>${next?`<a href="${urlFor(next.ch,next.s)}">下一节 →</a>`:'<a href="../">返回课程首页 →</a>'}`;article.append(pager);
 pager.querySelector('button').onclick=()=>{const st=readState();st.done=st.done.includes(section.id)?st.done.filter(id=>id!==section.id):[...st.done,section.id];saveState(st);refresh()};
 article.querySelectorAll('[data-panel=code] pre').forEach(pre=>{const button=document.createElement('button');button.className='copy-code';button.textContent='复制代码';pre.after(button);button.onclick=async()=>{try{await navigator.clipboard.writeText(pre.textContent);toast('代码已复制')}catch{toast('未能复制，请选中代码后复制')}}});
}
function remember(id){if(!course.sections.some(s=>s.id===id))return;const st=readState();st.last=id;saveState(st);sidebar.classList.remove('toc-open');mobile.setAttribute('aria-expanded','false')}
document.addEventListener('course:section',e=>remember(e.detail));
const initial=course.sections.find(s=>s.id===location.hash.slice(1))||course.sections[0];remember(initial.id);refresh();installSearch();
// Demo IDs used in a legacy chapter do not match lesson numbering; original mounts remain untouched.
