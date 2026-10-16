import {esc,installSearch} from './shared.js';
const cases=[
 [1,'新生数据表格','tableshow.html','ch-1-1','CSV · 类型转换','检查年龄列的数值类型；思考为什么读取文本后仍需转换。'],
 [1,'年龄分布与数据聚合','newstudent.html','ch-1-4','rollup · 扇区','对照原始记录与聚合结果，解释每个扇区代表的统计单元。'],
 [2,'可展开的树形列表','treelist.html','ch-2-4','层级 · 折叠','展开不同层级，说明父节点、子节点和点击目标的关系。'],
 [2,'树与数据表联动','nssystem.html','ch-2-2','分组 · 搜索 · 联动','选择分组并搜索，观察树和表格是否表达同一批记录。'],
 [3,'双系列条形图','sex_compare.html','ch-3-2','分类配色 · 对比','指出颜色表达的是类别还是大小；再观察共同基线的作用。'],
 [3,'连续数值的色彩映射','colormap.html','ch-3-2','colormap · 颜色编码','沿数值顺序观察颜色变化，寻找是否有突兀的视觉分界。'],
 [4,'双变量散点图','crime1985.html','ch-4-2','散点 · 坐标','找到一个偏离主要点群的观测，并说明坐标轴分别表达什么。'],
 [4,'线性回归与残差','regression.html','ch-4-3','拟合 · 残差','开启残差线，区分观测点、拟合值与误差；不要把拟合当作因果解释。'],
 [4,'用标记编码数值','mark.html','ch-4-1','标记 · 数量','观察每个标记代表多少数量，比较标记数与数值之间的关系。'],
 [4,'逐格生成等值线','contour.html','ch-4-5','Marching Squares · 网格','改变阈值，观察四个角点与等值线片段之间的对应。'],
 [4,'D3 等值线布局','contourd3.html','ch-4-5','contour · 地形','与逐格算法对照，说明等值线如何表达相同阈值的区域边界。'],
 [5,'按周观察日历热图','../lesson-05/#ch-5-3','ch-5-3','日历 · 周期','先找重复的星期模式，再寻找不符合模式的异常日期。'],
 [5,'螺旋与热图对照','calendar.html','ch-5-4','螺旋 · 时间布局','对照两种布局，观察相同时间单位在图形中如何对齐。'],
 [5,'螺旋日历：布局变体一','calendar1.html','ch-5-4','极坐标 · 交互','在相近角度比较日期，解释角度和半径各自表达什么。'],
 [5,'螺旋日历：布局变体三','calendar3.html','ch-5-4','时间 · 色彩','观察跨圈的颜色变化，比较周期模式与长期变化。']
];
function draw(){
 const chapter=document.querySelector('#case-chapter').value,tokens=document.querySelector('#case-query').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const hits=cases.filter(c=>(chapter==='all'||+chapter===c[0])&&tokens.every(t=>c.join(' ').toLowerCase().includes(t)));
 document.querySelector('#case-count').textContent=`显示 ${hits.length} / ${cases.length} 个案例`;
 document.querySelector('#case-grid').innerHTML=hits.map(([number,title,url,sid,tags,task])=>`<article class="case-card"><div class="case-meta"><span>第 ${number} 章</span><span>${esc(tags)}</span></div><h2>${esc(title)}</h2><p class="case-task"><strong>观察任务</strong>${esc(task)}</p><div class="case-links"><a class="primary" href="${esc(url)}">打开案例 →</a><a href="../lesson-0${number}/#${sid}">对应讲解</a></div></article>`).join('')||'<div class="empty-state"><h2>没有匹配的案例</h2><p>尝试“等值线”“日历”等关键词，或重置筛选。</p></div>';
}
document.querySelector('#case-chapter').onchange=draw;document.querySelector('#case-query').oninput=draw;
document.querySelector('#reset-cases').onclick=()=>{document.querySelector('#case-chapter').value='all';document.querySelector('#case-query').value='';history.replaceState(null,'',location.pathname);draw()};
const legacy=decodeURIComponent(location.hash);const number=legacy.match(/第-([1-5])-章/);if(number)document.querySelector('#case-chapter').value=number[1];draw();installSearch();
