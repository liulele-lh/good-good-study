const EXAM_KEY='phaseLabExamV2';
let examState=loadExam();
if(!examState.startedAt)examState.startedAt=Date.now();
saveExam();

document.addEventListener('DOMContentLoaded',()=>{
  renderQuestions();renderNumberGrid();restoreAnswers();updateTimer();setInterval(updateTimer,1000);
  document.querySelector('#finish-exam').addEventListener('click',finishExam);
  document.querySelector('#clear-exam').addEventListener('click',clearExam);
  document.querySelector('#redo-wrong').addEventListener('click',redoWrong);
  document.querySelector('#show-all-analysis').addEventListener('click',showAllAnalysis);
});
function loadExam(){try{return JSON.parse(localStorage.getItem(EXAM_KEY)||'{"answers":{},"submitted":{},"viewed":{}}')}catch{return{answers:{},submitted:{},viewed:{}}}}
function saveExam(){localStorage.setItem(EXAM_KEY,JSON.stringify(examState))}
function renderQuestions(){
  const root=document.querySelector('#question-list');
  root.innerHTML=QUESTIONS.map(q=>`<section class="card exam-question" id="q${q.id}" data-id="${q.id}">
    <div class="question-head"><h2>${q.id}. ${q.q}</h2><span>${q.difficulty} · ${q.points}分 · ${q.chapter}</span></div>
    ${renderVisual(q.visual)}${renderInput(q)}
    <div class="question-actions"><button class="submit-one" data-submit="${q.id}">提交答案</button><button data-analysis="${q.id}">查看分析</button><button data-redo="${q.id}">重做本题</button></div>
    <div class="feedback hide" id="feedback-${q.id}" role="status"></div>
    <div class="analysis" id="analysis-${q.id}" hidden><b>正确答案：</b>${answerText(q)}<br><b>考查知识点：</b>${q.analysis.knowledge}<br><b>分析步骤：</b>${q.analysis.steps}<br><b>其他选项：</b>${q.analysis.errors}<br><b>易错点：</b>${q.analysis.pitfall}<br><b>迁移方法：</b>${q.analysis.method}</div>
  </section>`).join('');
  root.addEventListener('change',saveCurrentAnswer);root.addEventListener('input',saveCurrentAnswer);
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.submit)submitOne(Number(b.dataset.submit));if(b.dataset.analysis)toggleAnalysis(Number(b.dataset.analysis));if(b.dataset.redo)redoOne(Number(b.dataset.redo))});
}
function renderInput(q){
  if(q.type==='text')return `<input class="text-answer" data-text="${q.id}" aria-label="第${q.id}题答案" placeholder="请输入答案">`;
  const multi=q.type==='multiple',type=multi?'checkbox':'radio';
  return `<div class="question-options">${q.options.map((o,i)=>`<label><input type="${type}" name="q${q.id}" value="${i}"> <span>${String.fromCharCode(65+i)}. ${o}</span></label>`).join('')}</div>`;
}
function renderVisual(v){
  if(v==='melt')return '<div class="chart-wrap"><svg class="chart" viewBox="0 0 500 190"><path class="axis" d="M45 15V160H470"/><path class="curve" d="M55 145L180 80L325 80L455 25"/><text x="105" y="120">A</text><text x="180" y="70">B</text><text x="320" y="70">C</text><text x="445" y="25">D</text></svg></div>';
  if(v==='boil')return '<div class="chart-wrap"><svg class="chart" viewBox="0 0 500 190"><path class="axis" d="M45 15V160H470"/><path class="curve orange" d="M55 145L250 60L455 60"/><text x="285" y="48">水平平台</text></svg></div>';
  if(v==='kettle')return '<div class="kettle"><i class="spout"></i><i class="steam-zone"></i><span class="transparent-label">透明区</span><span class="white-label">白气区</span></div>';
  if(v==='data')return '<table class="compare"><tr><th>时间/min</th><td>0</td><td>2</td><td>4</td><td>6</td><td>8</td></tr><tr><th>温度/℃</th><td>−5</td><td>0</td><td>0</td><td>0</td><td>5</td></tr></table>';
  return '';
}
function saveCurrentAnswer(e){
  const qEl=e.target.closest('.exam-question'),id=Number(qEl.dataset.id),q=QUESTIONS[id-1];
  examState.answers[id]=readAnswer(q,qEl);delete examState.submitted[id];saveExam();
  document.querySelector('#feedback-'+id).className='feedback hide';document.querySelector('#analysis-'+id).hidden=true;updateNav(id);
}
function readAnswer(q,el){
  if(q.type==='text')return el.querySelector('[data-text]').value.trim();
  const checked=[...el.querySelectorAll('input:checked')].map(i=>Number(i.value));
  return q.type==='multiple'?checked:(checked[0]??null);
}
function restoreAnswers(){
  QUESTIONS.forEach(q=>{const a=examState.answers[q.id];if(a===undefined)return;const el=document.querySelector('#q'+q.id);if(q.type==='text')el.querySelector('[data-text]').value=a;else{const arr=Array.isArray(a)?a:[a];arr.forEach(i=>{const input=el.querySelector(`input[value="${i}"]`);if(input)input.checked=true})}if(examState.submitted[q.id]!==undefined)showFeedback(q.id,examState.submitted[q.id]);if(examState.viewed[q.id])document.querySelector('#analysis-'+q.id).hidden=false});
}
function isAnswered(q,a){return q.type==='multiple'?Array.isArray(a)&&a.length>0:q.type==='text'?Boolean(a):a!==null&&a!==undefined}
function isCorrect(q,a){
  if(!isAnswered(q,a))return false;
  if(q.type==='multiple')return JSON.stringify([...a].sort())===JSON.stringify([...q.answer].sort());
  if(q.type==='text'){const norm=s=>String(s).replace(/\s/g,'').replace(/−/g,'-').toLowerCase();return q.answer.some(x=>norm(x)===norm(a))}
  return a===q.answer;
}
function submitOne(id){
  const q=QUESTIONS[id-1],a=examState.answers[id];
  if(!isAnswered(q,a)){const f=document.querySelector('#feedback-'+id);f.className='feedback no';f.textContent='○ 请先完成本题再提交。';return}
  const ok=isCorrect(q,a);examState.submitted[id]=ok;saveExam();showFeedback(id,ok);updateNav(id);
}
function showFeedback(id,ok){const f=document.querySelector('#feedback-'+id);f.className='feedback '+(ok?'ok':'no');f.textContent=ok?'✓ 回答正确，做得好！':'✗ 答案暂不正确。先回想知识点，再决定是否查看分析。'}
function toggleAnalysis(id){
  if(examState.submitted[id]===undefined){const f=document.querySelector('#feedback-'+id);f.className='feedback no';f.textContent='○ 建议先独立作答并提交，再查看分析。';return}
  const el=document.querySelector('#analysis-'+id);el.hidden=!el.hidden;if(!el.hidden){examState.viewed[id]=true;saveExam()}
}
function redoOne(id){
  const q=QUESTIONS[id-1],el=document.querySelector('#q'+id);el.querySelectorAll('input').forEach(x=>x.checked=false);const text=el.querySelector('[data-text]');if(text)text.value='';delete examState.answers[id];delete examState.submitted[id];saveExam();document.querySelector('#feedback-'+id).className='feedback hide';updateNav(id);
}
function renderNumberGrid(){document.querySelector('#number-grid').innerHTML=QUESTIONS.map(q=>`<a href="#q${q.id}" id="nav-${q.id}">${q.id}</a>`).join('');QUESTIONS.forEach(q=>updateNav(q.id))}
function updateNav(id){const n=document.querySelector('#nav-'+id);if(!n)return;n.className='';if(examState.submitted[id]===false)n.classList.add('wrong');else if(isAnswered(QUESTIONS[id-1],examState.answers[id]))n.classList.add('answered')}
function updateTimer(){const sec=Math.floor((Date.now()-examState.startedAt)/1000),m=String(Math.floor(sec/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');document.querySelector('#timer').textContent=m+':'+s}
function finishExam(){
  const results=QUESTIONS.map(q=>({q,answered:isAnswered(q,examState.answers[q.id]),correct:isCorrect(q,examState.answers[q.id])}));
  const score=results.reduce((s,r)=>s+(r.correct?r.q.points:0),0),correct=results.filter(r=>r.correct).length,unanswered=results.filter(r=>!r.answered).length,wrong=30-correct-unanswered;
  examState.finishedAt=Date.now();saveExam();const panel=document.querySelector('#result-panel');panel.classList.add('show');panel.scrollIntoView({behavior:'smooth'});
  const ring=document.querySelector('#score-ring');ring.style.setProperty('--score',score+'%');ring.dataset.score=score+'分';
  document.querySelector('#result-stats').innerHTML=`<div class="stat"><strong>${correct}</strong>正确</div><div class="stat"><strong>${wrong}</strong>错误</div><div class="stat"><strong>${unanswered}</strong>未答</div><div class="stat"><strong>${document.querySelector('#timer').textContent}</strong>用时</div>`;
  document.querySelector('#wrong-ids').textContent=results.filter(r=>!r.correct&&r.answered).map(r=>r.q.id).join('、')||'无';
  document.querySelector('#viewed-ids').textContent=Object.keys(examState.viewed).join('、')||'无';
  const chapters=[...new Set(QUESTIONS.map(q=>q.chapter))],weak=[];
  document.querySelector('#mastery').innerHTML=chapters.map(ch=>{const set=results.filter(r=>r.q.chapter===ch),pct=Math.round(set.filter(r=>r.correct).length/set.length*100);let label=pct>=90?'掌握扎实':pct>=75?'基本掌握':pct>=60?'需要巩固':'建议重学';if(pct<75)weak.push(ch);return `<div class="mastery-row"><b>${ch}</b><div class="bar"><i style="width:${pct}%"></i></div><span>${pct}% · ${label}</span></div>`}).join('');
  document.querySelector('#advice').textContent=weak.length?`建议优先复习：${weak.join('、')}。重做错题时，先写出研究对象和初末状态。`:'各部分掌握都较稳固，可以尝试向同学讲解最容易混淆的现象。';
  const reviewMap={'温度与温度计':'temperature.html','三态与微观模型':'states.html','熔化与凝固':'melting.html','汽化':'vaporization.html','液化':'liquefaction.html','升华与凝华':'sublimation.html','实验与综合':'experiment.html'};
  document.querySelector('#review-link').href=weak.length?reviewMap[weak[0]]:'index.html';
}
function redoWrong(){QUESTIONS.forEach(q=>{if(examState.submitted[q.id]===false)redoOne(q.id)});document.querySelector('#result-panel').classList.remove('show');document.querySelector('#question-list').scrollIntoView({behavior:'smooth'})}
function showAllAnalysis(){QUESTIONS.forEach(q=>{document.querySelector('#analysis-'+q.id).hidden=false;examState.viewed[q.id]=true});saveExam()}
function clearExam(){if(!confirm('确定清空30题的全部作答记录吗？'))return;localStorage.removeItem(EXAM_KEY);location.reload()}
function answerText(q){if(q.type==='text')return q.answer[0];const ids=Array.isArray(q.answer)?q.answer:[q.answer];return ids.map(i=>String.fromCharCode(65+i)+'. '+q.options[i]).join('；')}
