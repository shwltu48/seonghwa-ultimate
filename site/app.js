'use strict';
const D = window.LESSON;
let stage = 0;
let answers = {};
let choice = null;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function court(interactive=false, blank=false) {
  return `<div class="court" role="group" aria-label="전술판. 공격 방향 오른쪽. 나는 왼쪽 아래, A는 중앙 아래, B는 중앙 위, C는 오른쪽 중간. 수비 ①은 A의 왼쪽 아래, ②는 C의 왼쪽 아래."><span class="endzone">공격 방향 →<br>엔드존</span>${blank?'':`<svg viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="pass-arrow" markerWidth="4" markerHeight="4" refX="3" refY="1.5" orient="auto"><path d="M0 0L3 1.5L0 3" fill="none" stroke="#375c24" stroke-width=".7"/></marker></defs><path id="pass-path" d="" stroke="#375c24" stroke-width=".7" stroke-dasharray="2 1" fill="none" marker-end="url(#pass-arrow)"/></svg><span class="player thrower" style="left:23%;top:70%">나</span>${D.choices.map(c=>interactive?`<button class="player" style="left:${c.x}%;top:${c.y}%" data-pick="${c.id}" aria-label="${c.label}에게 패스" aria-pressed="false">${c.id}</button>`:`<span class="player" style="left:${c.x}%;top:${c.y}%">${c.id}</span>`).join('')}<span class="player defender" style="left:33%;top:77%">①</span><span class="player defender" style="left:66%;top:64%">②</span>`}</div><div class="court-legend"><span><strong>●</strong> 공격수</span><span>□ 수비수</span><span>나 = 디스크 소유자</span></div>`;
}
function teacher(text) {return `<details class="teacher-detail"><summary>교사 진행 안내 · 펼치기</summary><p>${text}</p></details>`;}
function render(){
  document.querySelectorAll('#steps button').forEach((b,i)=>{if(i===stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('stage-label').textContent=`MISSION ${D.timeline[stage].n} · ${D.timeline[stage].title}`;
  $('stage-time').textContent=`${D.timeline[stage].minutes}분`;
  $('progress').style.width=`${(stage+1)*20}%`;
  $('counter').textContent=`0${stage+1} / 05`;
  $('prev').disabled=stage===0;$('next').disabled=stage===4;
  let html='';
  if(stage===0) html=`<p class="stage-kicker">활동지 1쪽 · 생각 열기</p><h3>디스크는 내 손에.<br>다음 패스는 누구에게?</h3><p class="stage-lead">가장 앞에 있는 친구가 늘 가장 좋은 선택일까요? 먼저 혼자 판단한 뒤, 옆 친구의 이유를 들어 보세요.</p><div class="two-col"><div>${court()}<p class="notice">교실 탐구용 4 대 2 정지 장면입니다. 공식 경기 인원·경기장 비율과 다릅니다.</p></div><div class="prompt-box"><h4>30초, 나의 첫 판단</h4><ol><li>A · B · C 중 한 명을 고르세요.</li><li>수비 위치와 패스 거리를 살펴보세요.</li><li>“나는 ___에게 패스하겠다. 왜냐하면 ___.”</li></ol><p>활동지에 첫 생각을 남기세요.<br>수업이 끝나면 생각이 어떻게 바뀌었는지 확인합니다.</p></div></div>`;
  if(stage===1) html=`<p class="stage-kicker">활동지 1쪽 · 규칙 챌린지</p><h3>좋은 작전은 규칙에서 시작된다.</h3><p class="stage-lead">읽고, 판단하고, 근거를 말해 보세요. O는 ‘맞다’, X는 ‘아니다’입니다.</p><div class="rules-grid">${D.rules.map((r,i)=>`<article class="rule"><span class="num">RULE 0${i+1}</span><h4>${r.title}</h4><p>${r.body}</p></article>`).join('')}</div><h4 class="quiz-title">네 장면, 네 번의 판단</h4>${D.quiz.map((q,i)=>`<div class="quiz-item"><p class="quiz-question">${i+1}. ${q.q}</p><div class="quiz-options" role="group" aria-label="${i+1}번 답 선택"><button data-quiz="${i}" data-value="true" aria-pressed="false">O 맞다</button><button data-quiz="${i}" data-value="false" aria-pressed="false">X 아니다</button></div><div class="quiz-feedback" id="feedback-${i}" aria-live="polite"></div></div>`).join('')}`;
  if(stage===2) html=`<p class="stage-kicker">활동지 1쪽 · 전술 탐구</p><h3>가까운 친구? 앞선 친구?<br>패스 길이 열린 친구!</h3><p class="stage-lead">선택하기 전에 이유를 설명하세요. 선수 또는 아래 버튼을 누르면 패스 경로와 해설이 나타납니다.</p><div class="two-col"><div>${court(true)}<p class="notice">공격 방향은 오른쪽입니다. 이 그림은 가능한 선택을 비교하기 위한 정지 장면입니다.</p></div><div><div class="choice-list" role="group" aria-label="패스 대상 선택">${D.choices.map(c=>`<button data-pick="${c.id}" aria-pressed="false">${c.label}</button>`).join('')}</div><div class="feedback" id="tactic-feedback" aria-live="polite">아직 선택하지 않았습니다. 패스 길 · 수비 위치 · 거리를 살펴보세요.</div><p class="notice">도전 질문: 패스가 끝난 뒤 ‘나’는 어디로 움직여야 다시 도움을 줄 수 있을까요?</p></div></div>`;
  if(stage===3) html=`<p class="stage-kicker">활동지 2쪽 · 모둠 작전 회의</p><h3>세 번의 패스, 하나의 팀.</h3><p class="stage-lead">4~5명이 전술 설계자 · 기록자 · 발표자 · 공정성 점검자 역할을 나눕니다. 다섯 번째 학생은 공간 관찰자를 맡습니다.</p><div class="two-col"><div><span class="mission-badge">MISSION A / 7분</span><h4>종이 코트 위에 작전을 그리세요.</h4>${court(false,true)}<div class="plan-mission">공격수 4명과 수비수 2명을 배치하세요. <strong>실선은 패스, 점선은 이동</strong>입니다. 세 번의 패스로 엔드존까지 연결하는 계획을 그리되, 수비가 움직이면 바꿀 대안도 적으세요.<p>‘세 번의 패스’와 ‘4 대 2’는 <strong>이번 전술 설계 과제의 조건</strong>입니다. 실제 경기의 득점 조건이나 공식 인원이 아닙니다.</p></div></div><div><span class="mission-badge">MISSION B / 3분 + 수정 2분</span><div class="conflict">${D.conflict}</div><ol class="dialogue-list">${D.dialogue.map(t=>`<li>${t}</li>`).join('')}</ol><p class="notice">소리 크기로 결론 내리지 않기. 동의하지 않는 파울 판정의 일반적인 재개 예는 이전 던진 선수에게 디스크를 돌려주고 체크 후 재개하는 것입니다. 실제 판정은 상황과 해당 규칙을 확인합니다.</p></div></div>`;
  if(stage===4) html=`<p class="stage-kicker">활동지 2쪽 · 자기평가와 퇴장 질문</p><h3>좋은 선수는,<br>다음 선택을 더 좋게 만든다.</h3><p class="stage-lead">모둠 작전 한 가지를 공유하고, 첫 판단과 비교하세요. ‘잘했다’보다 ‘어떻게 달라졌는지’를 말해 봅시다.</p><div class="reflection-grid"><div class="reflection-card"><b>01 · 판단</b>패스 대상을 선택한 이유를 수비 위치와 연결해 설명했나요?</div><div class="reflection-card"><b>02 · 전략</b>패스 후 이동과 수비가 달라졌을 때의 대안을 제시했나요?</div><div class="reflection-card"><b>03 · 존중</b>다른 의견을 듣고, 상황과 규칙을 근거로 대화했나요?</div></div><p class="notice">활동지에서 각 항목을 ‘스스로 가능 / 도움받아 가능 / 더 연습’으로 표시하세요.</p><div class="exit-ticket"><small>EXIT TICKET</small><p>${D.exit}</p></div><a class="button" href="pdf/worksheet.pdf" download>활동지 PDF 다운로드 ↓</a>`;
  $('stage').innerHTML=`<div class="stage-content">${html}${teacher(D.timeline[stage].teacher)}</div>`;
  document.querySelectorAll('[data-quiz]').forEach(b=>b.addEventListener('click',()=>answer(Number(b.dataset.quiz),b.dataset.value==='true')));
  document.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.pick)));
  if(stage===1)Object.entries(answers).forEach(([i,v])=>answer(Number(i),v));
  if(stage===2&&choice)pick(choice);
  window.dispatchEvent(new CustomEvent('lesson:render',{detail:{stage}}));
}
function answer(i,value){answers[i]=value;document.querySelectorAll(`[data-quiz="${i}"]`).forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.value==='true')===value)));const q=D.quiz[i];$(`feedback-${i}`).innerHTML=`<strong>${value===q.answer?'정확해요.':'다시 살펴봐요.'} 정답 ${q.answer?'O':'X'}</strong>${esc(q.why)}`;window.dispatchEvent(new CustomEvent('lesson:answer',{detail:{index:i,value}}));}
function pick(id){choice=id;const c=D.choices.find(c=>c.id===id);document.querySelectorAll('[data-pick]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.pick===id));b.classList.toggle('selected',b.dataset.pick===id);});$('pass-path').setAttribute('d',`M23 39.2 L${c.x} ${c.y*.56}`);$('tactic-feedback').textContent=c.feedback;window.dispatchEvent(new CustomEvent('lesson:choice',{detail:{id}}));}
function go(n,focus=true){const previous=stage;stage=n;render();window.dispatchEvent(new CustomEvent('lesson:navigate',{detail:{stage,previous}}));if(focus){$('stage').focus({preventScroll:true});$('lesson').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
$('goals').innerHTML=D.goals.map(g=>`<li>${g}</li>`).join('');
$('steps').innerHTML=D.timeline.map((t,i)=>`<button data-step="${i}"><span class="step-num">${t.n} / ${t.minutes} MIN</span><span>${t.title}</span></button>`).join('');
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.step))));
$('standards').innerHTML=D.standards.map(s=>`<div class="standard"><strong>[${s.code}]</strong><p>${s.text}</p><small>${s.use}</small></div>`).join('');
$('sources').innerHTML=`<div class="sources">${D.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a><p>${s.note}</p>`).join('')}</div>`;
$('prev').addEventListener('click',()=>{if(stage>0)go(stage-1)});$('next').addEventListener('click',()=>{if(stage<4)go(stage+1)});
$('present').addEventListener('click',()=>{const active=document.body.classList.toggle('present');$('present').setAttribute('aria-pressed',String(active));$('present').textContent=active?'기본 크기':'화면 확대';});
$('reset').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());$('confirm-reset').addEventListener('click',()=>{answers={};choice=null;$('reset-dialog').close();window.dispatchEvent(new CustomEvent('lesson:reset'));go(0)});
$('print-worksheet').addEventListener('click',()=>{window.open('print.html?type=worksheet&print=1','_blank','noopener,noreferrer');});
window.lessonControl={getStage:()=>stage,navigate:go,setAnswer:answer,setTarget:pick};
render();
