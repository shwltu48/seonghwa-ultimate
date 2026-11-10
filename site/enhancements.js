'use strict';
(() => {
  const KEY='seonghwa.ultimate.lesson.v2', D=window.LESSON, C=window.lessonControl;
  const $=id=>document.getElementById(id), now=()=>Date.now();
  const stageMinutes=D.timeline.map(x=>x.minutes), starts=stageMinutes.map((_,i)=>stageMinutes.slice(0,i).reduce((a,b)=>a+b,0));
  const NOTE_FIELDS=[
    {id:'firstTarget',title:'처음 고른 패스 대상',hint:'A, B, C 가운데 선택을 적어요. 이유는 아래 칸에 남겨 주세요.',rows:1,max:40},
    {id:'firstReason',title:'나의 첫 근거',hint:'패스 거리와 수비 위치를 살펴본 이유를 적어요.',rows:3,max:800},
    {id:'revisedReason',title:'생각이 바뀐 순간',hint:'도전 상황을 보고 선택을 바꾸거나 유지한 이유를 적어요.',rows:3,max:800},
    {id:'route',title:'우리 팀의 3회 연결 작전',hint:'첫째 패스 → 둘째 패스 → 셋째 패스와 선수 이동을 기록해요.',rows:4,max:1000},
    {id:'alternative',title:'수비가 길을 막으면?',hint:'원래 길이 닫혔을 때 시도할 다음 패스를 적어요.',rows:3,max:800},
    {id:'dialogue',title:'존중하며 판정 대화하기',hint:'내가 본 사실 · 상대가 본 사실 · 규칙에 따른 재개를 적어요.',rows:3,max:800},
    {id:'exit',title:'다음 실제 경기에서 해 볼 일',hint:'공간 활용 행동과 존중하는 행동을 하나씩 적어요.',rows:3,max:800}
  ];
  const DEFAULT={version:2,stage:0,completed:[],target:'',quiz:{},challenges:{},notes:Object.fromEntries(NOTE_FIELDS.map(f=>[f.id,''])),rubric:{},timer:{remaining:300,active:false,stamp:null,total:0},updated:now()};
  function cleanState(raw){
    if(!raw||raw.version!==2||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>=D.timeline.length)throw Error('이 수업 사이트의 기록 파일이 아닙니다.');
    const s={...DEFAULT,stage:raw.stage};
    s.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(x=>Number.isInteger(x)&&x>=0&&x<D.timeline.length))]:[];
    s.target=D.choices.some(c=>c.id===raw.target)?raw.target:'';
    s.notes={...DEFAULT.notes};
    for(const f of NOTE_FIELDS)if(typeof raw.notes?.[f.id]==='string')s.notes[f.id]=raw.notes[f.id].slice(0,f.max);
    s.quiz={};for(let i=0;i<D.quiz.length;i++)if(typeof raw.quiz?.[i]==='boolean')s.quiz[i]=raw.quiz[i];
    s.rubric={};for(const r of D.rubric)if(['strong','developing','support'].includes(raw.rubric?.[r.name]))s.rubric[r.name]=raw.rubric[r.name];
    s.challenges={};for(const c of D.challenges){const v=raw.challenges?.[c.level];if(v&&Number.isInteger(v.choice)&&v.choice>=0&&v.choice<c.options.length)s.challenges[c.level]={choice:v.choice,reason:typeof v.reason==='string'?v.reason.slice(0,1000):'',explored:v.explored===true};}
    const t=raw.timer||{};s.timer={remaining:Number.isFinite(t.remaining)?Math.max(0,Math.min(1800,Math.floor(t.remaining))):stageMinutes[s.stage]*60,active:false,stamp:null,total:Number.isFinite(t.total)?Math.max(0,Math.min(2700,Math.floor(t.total))):starts[s.stage]*60};
    s.updated=Number.isFinite(raw.updated)?raw.updated:now();return s;
  }
  let state;try{state=cleanState(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{state=JSON.parse(JSON.stringify(DEFAULT))}
  let restoring=false,internalNavigation=false,tickHandle=null, lastTouch=state.timer.stamp||now();
  function save(){state.updated=now();state.timer.stamp=state.timer.active?now():null;try{localStorage.setItem(KEY,JSON.stringify(state));$('storage-state').textContent=`이 기기에 저장 · ${new Date(state.updated).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}`;$('storage-state').classList.remove('clock-announcement')}catch{$('storage-state').textContent='이 기기의 저장 공간이 부족합니다. 백업 파일을 내려받으세요.';$('storage-state').classList.add('clock-announcement')}}
  function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
  function ledger(){
    const root=$('learning-ledger');root.replaceChildren();root.append(el('span','ledger-title','오늘의 진행'));
    D.timeline.forEach((t,i)=>{const s=el('span','ledger-step',`${state.completed.includes(i)?'✓ ':''}${t.n} ${t.title}`);s.dataset.complete=String(state.completed.includes(i));root.append(s)});
    root.append(el('span','ledger-stats',`${state.completed.length} / ${D.timeline.length}단계 · 퀴즈 ${Object.keys(state.quiz).length}/${D.quiz.length} · 도전 ${Object.values(state.challenges).filter(v=>v.explored).length}/${D.challenges.length}`));
    $('stage-completion-count').textContent=`${state.completed.length} / ${D.timeline.length} 단계 기록`;
    $('stage-complete').textContent=state.completed.includes(state.stage)?'완료 기록 해제':'이 단계 마치기';$('stage-complete').setAttribute('aria-pressed',String(state.completed.includes(state.stage)));
    document.querySelectorAll('#steps [data-step]').forEach((b,i)=>{b.dataset.complete=String(state.completed.includes(i));let badge=b.querySelector('.step-done');if(state.completed.includes(i)&&!badge){badge=el('span','step-done','✓ 완료');b.append(badge)}else if(!state.completed.includes(i)&&badge)badge.remove()});
  }
  function createNotes(){
    const root=$('notebook-fields');root.replaceChildren();
    for(const f of NOTE_FIELDS){const box=el('div','note-card'),label=el('label','',f.title),id=`note-${f.id}`;label.htmlFor=id;
      box.append(label,el('p','',f.hint));const input=document.createElement('textarea');input.id=id;input.name=f.id;input.rows=f.rows;input.maxLength=f.max;input.value=state.notes[f.id];input.autocomplete='off';input.spellcheck=true;
      const count=el('div','field-count',`${input.value.length} / ${f.max}`);input.addEventListener('input',()=>{state.notes[f.id]=input.value;count.textContent=`${input.value.length} / ${f.max}`;save()});box.append(input,count);root.append(box);
    }
    const heading=el('div','rubric-heading');heading.append(el('h3','','교사용 관찰 · 성취기준에 연결한 형성평가'),el('p','','학생의 이름이나 점수는 기록하지 않습니다. 모둠의 설명과 대화를 바탕으로 다음 발문을 골라 보세요. 관찰 평정은 교사가 선택합니다.'));
    root.append(heading);const grid=el('div','rubric-grid');
    for(const r of D.rubric){const card=el('section','rubric-card'),label=el('label','',r.name),id=`rubric-${D.rubric.indexOf(r)}`;label.htmlFor=id;card.append(label,el('small','rubric-standard',`[${r.standard}] · 관찰 초점`));
      const select=document.createElement('select');select.id=id;select.dataset.rubric=r.name;select.setAttribute('aria-label',`${r.name} 관찰 기록`);
      for(const [v,t] of [['','관찰 전 · 선택 사항'],['strong','근거와 대안을 스스로 설명'],['developing','도움을 받아 한 가지 설명'],['support','다음 수업에서 다시 지원']]){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o)}select.value=state.rubric[r.name]||'';
      const response=el('div','rubric-copy',select.value? r[select.value]:'선택하면 관찰 근거와 다음 발문을 확인합니다.');select.addEventListener('change',()=>{if(select.value)state.rubric[r.name]=select.value;else delete state.rubric[r.name];response.textContent=select.value?`${r[select.value]} 다음 발문: ${r.prompt}`:'선택하면 관찰 근거와 다음 발문을 확인합니다.';save()});card.append(select,response);grid.append(card);
    }
    root.append(grid);
    const noteFeedback=el('div','rubric-feedback','');noteFeedback.id='rubric-feedback';root.append(noteFeedback);updateReflection();
  }
  function updateReflection(){
    const chosen=Object.keys(state.rubric).length;const done=NOTE_FIELDS.filter(f=>state.notes[f.id].trim()).length;
    const box=$('rubric-feedback');if(box)box.textContent=chosen===0?'형성평가는 점수나 서열을 자동으로 만들지 않습니다. 관찰 근거와 다음 학습 지원을 함께 기록하세요.':`${chosen}개 관찰 기준을 선택했습니다. 이번 기록은 수업 계획 참고용이며 학생별 점수·서열로 변환되지 않습니다.`;
    const g=$('learning-ledger');if(g){const s=g.querySelector('.ledger-stats');if(s)s.textContent=`${state.completed.length}/5단계 · 퀴즈 ${Object.keys(state.quiz).length}/4 · 도전 ${Object.values(state.challenges).filter(v=>v.explored).length}/3 · 노트 ${done}/7`}
  }
  function challengeDock(){
    const old=$('challenge-dock');if(old)old.remove();if(C.getStage()!==2)return;
    const panel=el('section','challenge-dock');panel.id='challenge-dock';panel.setAttribute('aria-labelledby','challenge-title');
    const head=el('div','challenge-heading'),intro=el('div');intro.append(el('h4','','다른 수비, 다른 판단'),el('p','','난이도를 골라 상황을 읽으세요. 먼저 이유를 적고 선택을 확인하면 근거에 맞춘 피드백이 열립니다. 정답 수가 아니라 판단 근거를 기록합니다.'));head.append(intro);panel.append(head);
    const options=el('div','challenge-grid');
    D.challenges.forEach((c,i)=>{const b=el('button','challenge-open');b.type='button';b.dataset.challenge=c.level;b.setAttribute('aria-pressed','false');b.append(el('small','',`도전 ${i+1} · ${c.level}`),el('span','',c.title));b.addEventListener('click',()=>showChallenge(c));options.append(b)});panel.append(options);
    const target=el('div','');target.id='challenge-detail';target.setAttribute('aria-live','polite');panel.append(target);
    const content=$('stage').querySelector('.stage-content');content?.append(panel);
    if(selectedChallenge)showChallenge(D.challenges.find(c=>c.level===selectedChallenge)||D.challenges[1]);
  }
  let selectedChallenge='';
  function showChallenge(c){
    selectedChallenge=c.level;const target=$('challenge-detail'),prior=state.challenges[c.level];
    document.querySelectorAll('.challenge-open').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.challenge===c.level)));
    target.replaceChildren();const question=el('div','challenge-question');question.append(el('span','mission-badge',`${c.level} 난이도`),el('h5','',c.title),el('p','',c.situation));target.append(question);
    const help=el('details','challenge-hint'),summary=el('summary','','도움말 보기');help.append(summary,el('p','',c.hint));target.append(help);
    const lab=el('p','stage-kicker',c.followup),reason=document.createElement('textarea');reason.id='challenge-reason';reason.maxLength=1000;reason.rows=2;reason.className='challenge-reason';reason.placeholder='이유를 먼저 적어 보세요. 15~1000자 권장, 이름은 입력하지 않아도 됩니다.';reason.value=prior?.reason||'';lab.htmlFor='challenge-reason';target.append(lab,reason);
    const choices=el('div','challenge-answer');choices.setAttribute('role','group');choices.setAttribute('aria-label',c.title+' 선택지');let selected=prior?.choice??-1;
    const feedback=el('div','challenge-feedback');feedback.setAttribute('aria-live','polite');
    c.options.forEach((op,i)=>{const b=el('button','',`${String.fromCharCode(65+i)}. ${op}`);b.type='button';b.setAttribute('aria-pressed',String(i===selected));b.addEventListener('click',()=>{selected=i;choices.querySelectorAll('button').forEach((x,j)=>x.setAttribute('aria-pressed',String(j===i)));if(prior?.explored)feedback.replaceChildren()});choices.append(b)});target.append(choices);
    const submit=el('button','dark','내 근거와 선택 확인');submit.type='button';target.append(submit);target.append(feedback);
    if(prior?.explored)feedback.textContent=challengeFeedback(c,prior.choice,prior.reason);
    submit.addEventListener('click',()=>{const why=reason.value.trim();if(selected<0){feedback.textContent='먼저 상황에 맞는 선택을 골라 주세요.';choices.querySelector('button')?.focus();return}if(why.length<5){feedback.textContent='선택한 까닭을 먼저 한 문장으로 적어 주세요.';reason.focus();return}state.challenges[c.level]={choice:selected,reason:why,explored:true};save();feedback.replaceChildren(el('strong','',selected===c.best?'선택의 근거를 확인해 보세요.':'다른 경로도 다시 살펴보세요.'),el('span','',challengeFeedback(c,selected,why)));updateReflection();}
    );
  }
  function challengeFeedback(c,index,why){return `선택 ${String.fromCharCode(65+index)}: ${c.feedback} 기록한 근거: “${why}”`;}
  function renderGlossary(){const old=$('lesson-glossary');if(old)old.remove();if(C.getStage()!==1)return;const d=el('details','lesson-glossary'),s=el('summary','','핵심 낱말을 다시 보기');d.append(s);const grid=el('div','glossary-grid');for(const item of D.glossary){const box=el('article','glossary-term');box.append(el('h5','',item.term),el('p','',item.meaning));grid.append(box)}d.append(grid);$('stage').querySelector('.stage-content')?.append(d)}
  function updateClock(){const t=state.timer;if(!t.active)return;const at=now(),delta=Math.floor((at-t.stamp)/1000);if(delta<1)return;t.remaining=Math.max(0,t.remaining-delta);t.total=Math.min(2700,t.total+delta);t.stamp=at;lastTouch=at;
    if(t.remaining===0){state.completed=[...new Set([...state.completed,state.stage])];t.active=false;t.stamp=null;if(state.stage<D.timeline.length-1){internalNavigation=true;state.stage++;t.remaining=stageMinutes[state.stage]*60;save();C.navigate(state.stage,false);internalNavigation=false;t.active=true;t.stamp=now();announce(`‘${D.timeline[state.stage-1].title}’ 단계가 끝났습니다. 다음 단계로 이동합니다.`)}else{save();announce('45분 수업 코스가 끝났습니다. 나의 전술 연구 노트에서 생각의 변화를 정리하세요.')}}
    else save();paintClock();ledger();updateReflection();
  }
  function announce(text){$('clock-caption').textContent=text;$('clock-caption').classList.add('clock-announcement')}
  function paintClock(){const t=state.timer,remaining=t.remaining;const mins=Math.floor(remaining/60),secs=remaining%60;$('clock-display').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    const total=Math.min(45,Math.floor(t.total/60)),caption=t.active?`전체 ${String(total).padStart(2,'0')} / 45분 · ${D.timeline[state.stage].title} 단계`:(t.total?`일시 정지 · 전체 ${String(total).padStart(2,'0')} / 45분`:'준비되면 수업 시계를 시작하세요.');if($('clock-caption').textContent!==caption)$('clock-caption').textContent=caption;$('clock-toggle').textContent=t.active?'일시 정지':(t.total||state.completed.length?'계속':'45분 시작');$('clock-toggle').setAttribute('aria-pressed',String(t.active));
  }
  function stopClock(keep=true){if(state.timer.active){const d=Math.floor((now()-state.timer.stamp)/1000);state.timer.remaining=Math.max(0,state.timer.remaining-d);state.timer.total=Math.min(2700,state.timer.total+d);state.timer.active=false;state.timer.stamp=null}if(tickHandle){clearInterval(tickHandle);tickHandle=null}if(keep)save();paintClock()}
  function runClock(){if(state.timer.remaining===0){state.timer.remaining=stageMinutes[state.stage]*60}state.timer.active=true;state.timer.stamp=now();lastTouch=state.timer.stamp;if(!tickHandle)tickHandle=setInterval(updateClock,250);save();paintClock()}
  function exportRecord(){const payload={...state,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='seonghwa-ultimate-learning-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('기록을 JSON 백업 파일로 내려받았습니다.')}
  async function importRecord(file){if(!file)return;if(file.size>200000)throw Error('백업 파일이 너무 큽니다. 200KB 이하의 수업 기록 파일을 선택하세요.');const clean=cleanState(JSON.parse(await file.text()));clean.timer.active=false;clean.timer.stamp=null;state=clean;save();createNotes();restoring=true;C.navigate(state.stage,false);if(state.target)C.setTarget(state.target);restoring=false;ledger();challengeDock();renderGlossary();paintClock();updateReflection();announce('기록을 이 기기에 복원했습니다.')}
  function openPrint(){
    const w=window.open(new URL('print.html?type=notebook',location.href).href,'_blank');if(!w){announce('팝업이 차단되었습니다. 사이트의 팝업 허용을 켜고 다시 눌러 주세요.');return}
    const send=()=>{w.postMessage({type:'seonghwa-notebook-print',state},location.origin)};
    const timer=setInterval(()=>{if(w.closed){clearInterval(timer);return}try{if(w.document.readyState==='complete'&&w.document.getElementById('print-notebook-root')){clearInterval(timer);send()}}catch{}},200);setTimeout(()=>clearInterval(timer),8000);
  }
  function buildChallengePrint(){const ext=[];for(const c of D.challenges)ext.push(`<article><h3>${c.level} · ${c.title}</h3><p>${c.situation}</p><p><b>나의 근거:</b><span class="write-lines"></span></p><p><b>내 선택:</b> A / B / C</p><p><b>힌트:</b> ${c.hint}</p></article>`);return ext.join('')}
  function bind(){
    createNotes();
    document.querySelectorAll('[data-rubric]').forEach(s=>s.addEventListener('change',updateReflection));
    $('clock-toggle').addEventListener('click',()=>{if(state.timer.active)stopClock();else runClock()});
    $('stage-complete').addEventListener('click',()=>{const done=state.completed.includes(state.stage);state.completed=done?state.completed.filter(i=>i!==state.stage):[...state.completed,state.stage];save();ledger();announce(done?'단계 완료 기록을 해제했습니다.':'이 단계를 마친 것으로 기록했습니다.')});
    $('backup-export').addEventListener('click',exportRecord);
    $('backup-import').addEventListener('change',async e=>{try{await importRecord(e.target.files?.[0])}catch(err){announce(`백업을 불러오지 못했습니다. ${err.message}`)}finally{e.target.value=''}});
    $('notebook-print').addEventListener('click',openPrint);
    $('notebook-clear').addEventListener('click',()=>{const dialog=$('reset-dialog');dialog.querySelector('h2').textContent='전술 연구 노트를 지울까요?';dialog.querySelector('p').textContent='이 기기에 저장된 노트, 성찰, 도전 선택을 모두 지웁니다. 백업 파일이 필요하면 먼저 내려받으세요.';dialog.dataset.mode='notes';dialog.showModal()});
    $('cancel-reset').addEventListener('click',()=>{const dialog=$('reset-dialog');if(dialog.dataset.mode==='notes'){dialog.querySelector('h2').textContent='수업 진행만 초기화할까요?';dialog.querySelector('p').textContent='단계 완료와 현재 수업 타이머를 초기화합니다. 전술 노트와 백업 기록은 그대로 유지됩니다.';delete dialog.dataset.mode}});
    $('confirm-reset').addEventListener('click',()=>{const dialog=$('reset-dialog');if(dialog.dataset.mode==='notes'){stopClock(false);localStorage.removeItem(KEY);state=structuredClone(DEFAULT);createNotes();ledger();paintClock();renderGlossary();dialog.querySelector('h2').textContent='수업 진행만 초기화할까요?';dialog.querySelector('p').textContent='단계 완료와 현재 수업 타이머를 초기화합니다. 전술 노트와 백업 기록은 그대로 유지됩니다.';delete dialog.dataset.mode;dialog.close();announce('이 기기의 전술 연구 노트를 지웠습니다.');return}state.completed=[];state.timer={remaining:stageMinutes[0]*60,active:false,stamp:null,total:0};save();ledger();paintClock()});
    window.addEventListener('lesson:render',e=>{if(restoring)return;state.stage=e.detail.stage;challengeDock();renderGlossary();ledger();paintClock();if(state.stage===1)for(const [i,v] of Object.entries(state.quiz))if(typeof v==='boolean')C.setAnswer(Number(i),v);if(state.stage===2&&state.target)C.setTarget(state.target)});
    window.addEventListener('lesson:navigate',e=>{if(restoring)return;const n=e.detail.stage;if(n!==state.stage&&!internalNavigation){stopClock();state.stage=n;state.timer.remaining=stageMinutes[n]*60;state.timer.total=starts[n]*60;state.challenges=state.challenges;save();paintClock()}else{state.stage=n;save()};ledger()});
    window.addEventListener('lesson:choice',e=>{state.target=e.detail.id;if(!state.notes.firstTarget.trim()){state.notes.firstTarget=e.detail.id;const input=$('note-firstTarget');if(input){input.value=e.detail.id;const count=input.parentElement.querySelector('.field-count');if(count)count.textContent=`${e.detail.id.length} / 40`}}save();updateReflection()});
    window.addEventListener('lesson:answer',e=>{state.quiz[e.detail.index]=e.detail.value;save();updateReflection()});
    window.addEventListener('lesson:reset',()=>{stopClock(false);state.completed=[];state.target='';state.quiz={};state.challenges={};state.stage=0;state.timer={remaining:stageMinutes[0]*60,active:false,stamp:null,total:0};save();ledger();paintClock()});
    window.addEventListener('beforeunload',()=>stopClock());
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.timer.active){stopClock();announce('화면을 떠나 수업 시계를 일시 정지했습니다. 돌아와서 계속할 수 있습니다.')}});
    $('reset-dialog').addEventListener('close',()=>{const dialog=$('reset-dialog');if(dialog.dataset.mode==='notes'){dialog.querySelector('h2').textContent='수업 진행만 초기화할까요?';dialog.querySelector('p').textContent='단계 완료와 현재 수업 타이머를 초기화합니다. 전술 노트와 백업 기록은 그대로 유지됩니다.';delete dialog.dataset.mode}});
    $('stage-complete').addEventListener('click',updateReflection);
    ledger();paintClock();
  }
  bind();restoring=true;C.navigate(state.stage,false);if(state.target)C.setTarget(state.target);restoring=false;challengeDock();renderGlossary();ledger();paintClock();updateReflection();
})();
