const COURSE_KEY='phaseLabProgressV2';
const chapterFiles=['temperature.html','states.html','melting.html','vaporization.html','liquefaction.html','sublimation.html','experiment.html'];
const loadProgress=()=>{try{return JSON.parse(localStorage.getItem(COURSE_KEY)||'{}')}catch{return{}}};
const saveProgress=p=>localStorage.setItem(COURSE_KEY,JSON.stringify(p));

document.addEventListener('DOMContentLoaded',()=>{
  const file=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.main-nav a').forEach(a=>{if(a.getAttribute('href')===file)a.classList.add('active')});
  const progress=loadProgress();
  if(chapterFiles.includes(file)){progress[file]??={status:'learning',score:null};if(progress[file].status==='unlearned')progress[file].status='learning';saveProgress(progress)}
  renderHomeProgress(progress);
  setupComplete(file,progress);
  setupMiniQuiz(file,progress);
  setupTemperature();
  setupStates();
  setupMelting();
  setupVaporization();
  setupLiquefaction();
  document.querySelector('#reset-progress')?.addEventListener('click',()=>{if(confirm('确定清空全部学习进度和检测记录吗？')){localStorage.removeItem(COURSE_KEY);localStorage.removeItem('phaseLabExamV2');location.reload()}});
});

function renderHomeProgress(progress){
  let done=0;
  document.querySelectorAll('[data-course-file]').forEach(card=>{
    const item=progress[card.dataset.courseFile]||{},status=card.querySelector('.status');
    if(item.status==='done'){status.textContent=item.score==null?'已完成':`已完成 · ${item.score}分`;status.classList.add('done');done++}
    else if(item.status==='learning'){status.textContent='学习中'}else status.textContent='未学习';
  });
  const pct=Math.round(done/chapterFiles.length*100);
  const bar=document.querySelector('#home-progress');if(bar)bar.style.width=pct+'%';
  const text=document.querySelector('#home-progress-text');if(text)text.textContent=`已完成 ${done}/7 章（${pct}%）`;
}
function setupComplete(file,progress){
  const btn=document.querySelector('#complete-chapter');if(!btn)return;
  if(progress[file]?.status==='done')btn.textContent='✓ 本章已完成';
  btn.addEventListener('click',()=>{progress[file]={...(progress[file]||{}),status:'done'};saveProgress(progress);btn.textContent='✓ 本章已完成';btn.classList.add('ghost-button');});
}
function setupMiniQuiz(file,progress){
  const qs=[...document.querySelectorAll('.mini-question')];if(!qs.length)return;
  let answered=0,correct=0;
  qs.forEach(q=>q.querySelectorAll('button[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{
    if(q.dataset.done)return;q.dataset.done='1';answered++;
    const ok=btn.dataset.answer==='true';if(ok){correct++;btn.classList.add('correct')}else{btn.classList.add('wrong');q.querySelector('button[data-answer="true"]')?.classList.add('correct')}
    q.querySelector('.mini-feedback').textContent=ok?'✓ 回答正确。':`✗ 再看一眼：${q.dataset.explain}`;
    if(answered===qs.length){const score=Math.round(correct/qs.length*100);progress[file]={status:'done',score};saveProgress(progress);const out=document.querySelector('#mini-score');if(out)out.textContent=`本章小测：${score}分（${correct}/${qs.length}）`;}
  })));
}
function setupTemperature(){
  const slider=document.querySelector('#temp-slider');if(!slider)return;
  const val=document.querySelector('#temp-value'),mercury=document.querySelector('#mercury'),tip=document.querySelector('#temp-tip');
  const update=()=>{const t=Number(slider.value);val.textContent=t+'℃';mercury.style.height=Math.max(5,(t+30)/1.4)+'%';tip.textContent=t<0?`读作“零下${Math.abs(t)}摄氏度”`:t===0?'读作“零摄氏度”':`读作“${t}摄氏度”`};slider.addEventListener('input',update);update();
  const partInfo={玻璃泡:'与被测物充分接触，感受温度变化。',毛细管:'液柱在细管中升降，使微小体积变化更明显。',刻度:'用于读取温度数值，读数前要看分度值。',测温液体:'受热膨胀、遇冷收缩。'};
  document.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>document.querySelector('#part-info').textContent=partInfo[b.dataset.part]));
  let target=randTemp();const targetEl=document.querySelector('#reading-target'),input=document.querySelector('#reading-input'),check=document.querySelector('#reading-check'),next=document.querySelector('#reading-next'),feedback=document.querySelector('#reading-feedback');
  function randTemp(){return Math.floor(Math.random()*15)-7}function show(){targetEl.textContent=`模拟液柱顶端在 ${target}℃`;input.value='';feedback.textContent=''}
  check?.addEventListener('click',()=>feedback.textContent=Number(input.value)===target?'✓ 读数正确，别忘了单位℃。':`✗ 正确读数是 ${target}℃。`);
  next?.addEventListener('click',()=>{target=randTemp();show()});show();
}
function setupStates(){
  const data={熔化:['固态','液态','吸热','冰化成水'],凝固:['液态','固态','放热','水结成冰'],汽化:['液态','气态','吸热','湿衣服变干'],液化:['气态','液态','放热','露珠形成'],升华:['固态','气态','吸热','干冰变成气体'],凝华:['气态','固态','放热','霜的形成']};
  document.querySelectorAll('[data-change]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-change]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const d=data[b.dataset.change];document.querySelector('#change-info').innerHTML=`<strong>${b.dataset.change}</strong>：${d[0]} → ${d[1]}，<b>${d[2]}</b>。例：${d[3]}。`}));
}
function setupMelting(){
  document.querySelectorAll('[data-curve]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-curve]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const c=b.dataset.curve==='crystal';document.querySelector('#melt-line').setAttribute('d',c?'M65 188 L205 112 L355 112 L495 45':'M65 188 C170 164 260 125 335 95 S430 65 495 45');document.querySelector('#melt-platform').style.display=c?'block':'none';document.querySelector('#curve-info').textContent=c?'晶体在一定压强下有固定熔点；平台段继续吸热、温度不变，处于固液共存状态。':'非晶体没有固定熔点，在一段温度范围内逐渐软化，温度通常继续升高。'}));
  document.querySelectorAll('[data-segment]').forEach(s=>s.addEventListener('click',()=>document.querySelector('#segment-info').textContent=s.dataset.info));
}
function setupVaporization(){
  let n=0;document.querySelectorAll('[data-factor]').forEach(b=>b.addEventListener('click',()=>{b.classList.toggle('active');n=document.querySelectorAll('[data-factor].active').length;document.querySelector('#puddle').className=`puddle speed-${n}`;document.querySelector('#factor-info').textContent=`已启用 ${n}/3 个主要因素：温度越高、表面积越大、空气流动越快，蒸发越快。`}));
  const pressure=document.querySelector('#pressure');if(pressure){const out=document.querySelector('#boiling-point');const update=()=>{const p=Number(pressure.value),t=Math.round(100+26*Math.log(p/101));out.textContent=t+'℃';document.querySelector('#pressure-tip').textContent=p<101?'气压降低，沸点降低。高山上水不到100℃即可沸腾。':p>101?'气压升高，沸点升高。高压锅正是利用这一点。':'标准大气压下，纯水沸点约为100℃。'};pressure.addEventListener('input',update);update()}
}
function setupLiquefaction(){
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-scene]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#scene-info').textContent=b.dataset.explain}));
}
