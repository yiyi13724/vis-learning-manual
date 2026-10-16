import {esc,installSearch} from './shared.js';
const d3=window.d3,svg=d3.select('#chart-preview'),task=document.querySelector('#chart-task'),count=document.querySelector('#chart-count'),negative=document.querySelector('#chart-negative');
const ink='#164f85',teal='#087f8c';
function label(x,y,value,anchor='start',color='#596f80',size=12){svg.append('text').attr('x',x).attr('y',y).attr('fill',color).attr('font-size',size).attr('text-anchor',anchor).text(value)}
function axes(x,y){svg.append('g').attr('transform','translate(0,290)').call(d3.axisBottom(x).ticks(6));svg.append('g').attr('transform','translate(65,0)').call(d3.axisLeft(y).ticks(5));svg.selectAll('.domain,.tick line').attr('stroke','#cad9e3');svg.selectAll('.tick text').attr('fill','#596f80')}
function explain(name,description,encoding,reason,caution,link,text){
 document.querySelector('#chart-name').textContent=name;document.querySelector('#chart-svg-title').textContent=name+'：教学合成数据';document.querySelector('#chart-description').textContent=description;document.querySelector('#chart-encoding').textContent=encoding;document.querySelector('#chart-reason').textContent=reason;document.querySelector('#chart-caution').textContent=caution;document.querySelector('#chart-next').innerHTML=`<a href="${link}">${esc(text)} →</a>`;
}
function table(headers,rows){document.querySelector('#chart-data').innerHTML=`<table><caption>教学合成数据</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map(v=>`<td>${esc(v)}</td>`).join('')+'</tr>').join('')}</tbody></table>`}
function draw(){
 svg.selectAll(':not(title)').remove();
 const mode=task.value,n=+count.value,neg=negative.checked;
 document.querySelector('#category-options').hidden=!['compare','part'].includes(mode);document.querySelector('#chart-count-label').textContent=n;
 const values=Array.from({length:n},(_,i)=>({name:String.fromCharCode(65+i),value:15+(i*23+17)%70}));if(neg)values.forEach((d,i)=>{if(i%3===0)d.value=-d.value});
 if(mode==='compare'||(mode==='part'&&(n>6||neg))){
  const y=d3.scaleBand().domain(values.map(d=>d.name)).range([30,295]).padding(.3),x=d3.scaleLinear().domain([Math.min(0,d3.min(values,d=>d.value)),d3.max(values,d=>d.value)]).nice().range([80,650]);
  svg.append('g').attr('transform','translate(0,300)').call(d3.axisBottom(x).ticks(5));svg.append('path').attr('d',`M${x(0)} 25V295`).attr('stroke','#a5bacb');
  values.forEach(d=>{svg.append('rect').attr('x',x(Math.min(0,d.value))).attr('y',y(d.name)).attr('width',Math.abs(x(d.value)-x(0))).attr('height',y.bandwidth()).attr('rx',2).attr('fill',d.value<0?ink:teal);label(60,y(d.name)+y.bandwidth()/2+4,d.name,'end');label(x(d.value)+(d.value<0?-6:6),y(d.name)+y.bandwidth()/2+4,d.value,d.value<0?'end':'start')});
  explain(neg?'以零为基准的发散条形图':'横向条形图',mode==='part'?(neg?'检测到负数：先展示净值比较，不将负数强行解释为整体占比。':'类别较多：先比较各部分大小，比拥挤的扇区更便于逐项读取。'):'用共同基线比较各类别的数值大小。','纵向位置区分类别，横向长度表达数值；零线是共同参照。',neg?'正负值分别落在零线两侧。读者可以同时比较方向与幅度。':'相同基线下的长度适合逐项比较，较长的类别名称也可以放在左侧。',mode==='part'&&neg?'含负数时，常规饼图占比没有清晰含义。先确认“整体”定义，再决定是否计算比率。':'不要随意截断长度编码的零基线。按数值排序也应保留时间或等级等有意义的类别顺序。','../lesson-01/#ch-1-3','数据属性与视觉通道');table(['类别','数值'],values.map(d=>[d.name,d.value]));
 }
 if(mode==='part'&&n<=6&&!neg){
  const total=d3.sum(values,d=>d.value),pie=d3.pie().sort(null).value(d=>d.value),arc=d3.arc().innerRadius(68).outerRadius(125),g=svg.append('g').attr('transform','translate(235,165)');
  g.selectAll('path').data(pie(values)).join('path').attr('d',arc).attr('fill',(_,i)=>d3.schemeTableau10[i]).attr('stroke','white').attr('stroke-width',2).append('title').text(d=>`${d.data.name}：${(d.data.value/total*100).toFixed(1)}%`);label(235,165,'整体','middle',ink,16);label(235,190,String(total),'middle');values.forEach((d,i)=>{svg.append('rect').attr('x',420).attr('y',60+i*35).attr('width',12).attr('height',12).attr('fill',d3.schemeTableau10[i]);label(445,71+i*35,`${d.name} · ${(d.value/total*100).toFixed(1)}%`)});
  explain('环形图，搭配明确的占比标签','适用于少量非负、互不重叠且构成同一整体的部分。','扇区角度表达占比，颜色与文字标签区分类别。','当重点是“部分与整体”而不是精确排序时，可以用环形图概览组成。','先确认类别互斥且总量有意义；需要比较接近的数值时，条形图通常更容易读。这里的 6 类阈值是界面默认规则。','../lesson-01/#ch-1-3','视觉通道与数据语义');table(['类别','数值','占比'],values.map(d=>[d.name,d.value,(d.value/total*100).toFixed(1)+'%']));
 }
 if(mode==='trend'){
  const rows=Array.from({length:18},(_,i)=>[i+1,35+i*2+Math.round(12*Math.sin(i*.65))]),x=d3.scaleLinear().domain([1,18]).range([65,660]),y=d3.scaleLinear().domain([0,90]).range([290,30]);axes(x,y);svg.append('path').datum(rows).attr('d',d3.line().x(d=>x(d[0])).y(d=>y(d[1]))).attr('stroke',teal).attr('stroke-width',3).attr('fill','none');svg.selectAll('circle').data(rows).join('circle').attr('cx',d=>x(d[0])).attr('cy',d=>y(d[1])).attr('r',3).attr('fill',teal);label(615,330,'连续月份');
  explain('折线图','观察连续时间上的变化方向与局部起伏。','横轴表达时间，纵轴表达数值，圆点表示实际观测。','时间顺序是任务的一部分，线条帮助读者追踪相邻观测之间的变化。','不规则采样要保留真实时间间隔。缺失数据应明确标记；连接线不代表中间存在真实观测。','../lesson-05/#ch-5-2','标准时间可视化');table(['月份','数值'],rows);
 }
 if(mode==='distribution'){
  const sample=Array.from({length:48},(_,i)=>Math.round(50+18*Math.sin(i*1.7)+12*Math.cos(i*.8))),bins=d3.bin().domain([0,100]).thresholds(d3.range(0,101,10))(sample),x=d3.scaleLinear().domain([0,100]).range([65,660]),y=d3.scaleLinear().domain([0,d3.max(bins,d=>d.length)]).nice().range([290,30]);axes(x,y);svg.selectAll('rect').data(bins).join('rect').attr('x',d=>x(d.x0)+1).attr('y',d=>y(d.length)).attr('width',d=>Math.max(0,x(d.x1)-x(d.x0)-2)).attr('height',d=>290-y(d.length)).attr('fill',teal);label(20,20,'频数');label(610,330,'数值区间');
  explain('直方图','将一个数值变量分箱，观察集中区间与分布形状。','横轴为数值区间，柱高为落入该区间的观测数量。','分箱把大量独立值整理为分布，适合寻找集中区间、尾部与可能的多峰。','箱宽会改变分布的视觉形态。不要把连续区间误读为无序类别；本例使用等宽区间。','../lesson-04/#ch-4-1','数据转换');table(['区间','频数'],bins.map(d=>[`${d.x0}–${d.x1}${d.x1===100?'（含右端点）':'（不含右端点）'}`,d.length]));
 }
 if(mode==='relation'){
  const rows=Array.from({length:28},(_,i)=>[i*3+5,Math.round(15+i*2+12*Math.sin(i*2.1))]),x=d3.scaleLinear().domain([0,100]).range([65,660]),y=d3.scaleLinear().domain([0,90]).range([290,30]);axes(x,y);svg.selectAll('circle').data(rows).join('circle').attr('cx',d=>x(d[0])).attr('cy',d=>y(d[1])).attr('r',5).attr('fill',teal).attr('opacity',.7);label(16,20,'变量 Y');label(620,330,'变量 X');
  explain('散点图','比较两个数值变量，观察关联、分组和离群点。','一个点代表一个观测，两个坐标分别表达两个数值变量。','共同坐标系中的点位置能显示变量之间的关系，而不强制连接并无顺序的记录。','相关不等于因果。样本选择、极端值和重叠都可能影响判断，应结合原始数据与背景。','../lesson-04/#ch-4-2','坐标轴变换');table(['变量 X','变量 Y'],rows);
 }
 if(mode==='hierarchy'){
  const root=d3.hierarchy({name:'全部',children:[{name:'专业 A',children:[{name:'班级 1'},{name:'班级 2'}]},{name:'专业 B',children:[{name:'班级 3'},{name:'班级 4'}]}]});d3.tree().size([250,500])(root);const g=svg.append('g').attr('transform','translate(90,40)');g.selectAll('path').data(root.links()).join('path').attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x)).attr('stroke','#a5bacb').attr('fill','none');const node=g.selectAll('g').data(root.descendants()).join('g').attr('transform',d=>`translate(${d.y},${d.x})`);node.append('circle').attr('r',6).attr('fill',teal);node.append('text').attr('dy',-12).attr('text-anchor','middle').attr('fill',ink).attr('font-size',13).text(d=>d.data.name);
  explain('节点连接树','表达清晰的父子包含关系。','节点代表对象，连线代表直接父子关系，横向位置表示层级。','当任务是“谁属于谁”时，树布局能直接呈现层级结构。','普通树中每个非根节点只有一个父节点。交叉关系更适合网络图；节点之间距离不必然有数量含义。','../lesson-02/#ch-2-3','树布局');table(['父节点','子节点'],root.links().map(d=>[d.source.data.name,d.target.data.name]));
 }
 if(mode==='cycle'){
  const rows=Array.from({length:56},(_,i)=>[Math.floor(i/7)+1,i%7+1,Math.round(40+i*.4+20*Math.sin(i/7*Math.PI*2))]),color=d3.scaleSequential(d3.interpolateViridis).domain([0,100]);rows.forEach(([week,day,value])=>{svg.append('rect').attr('x',105+(day-1)*70).attr('y',45+(week-1)*27).attr('width',63).attr('height',21).attr('rx',3).attr('fill',color(value)).append('title').text(`第${week}周，星期${day}：${value}`)});['一','二','三','四','五','六','日'].forEach((v,i)=>label(136+i*70,28,'周'+v,'middle'));for(let i=0;i<8;i++)label(35,60+i*27,'第'+(i+1)+'周');[0,25,50,75,100].forEach((v,i)=>{svg.append('rect').attr('x',105+i*90).attr('y',285).attr('width',80).attr('height',10).attr('fill',color(v));label(105+i*90,318,String(v))});
  explain('按周排列的时间热图','把相同星期对齐，观察每周重复的模式。','列表示星期，行表示周次，颜色表达每天的数值，图例固定为 0–100。','重复时间单位被对齐后，周期模式比一长串记录更容易对照。','缺失值要与低数值区分。颜色适合看整体模式，精确比较应结合提示或数据表。','../lesson-05/#ch-5-3','日历热图');table(['周次','星期','数值'],rows);
 }
}
for(const control of [task,count,negative])control.addEventListener('input',draw);draw();installSearch();
