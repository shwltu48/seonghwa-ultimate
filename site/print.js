'use strict';
const params=new URLSearchParams(location.search),kind=params.get('type')||'worksheet';
const template=document.getElementById(kind),pages=document.getElementById('pages'),notebook=document.getElementById('print-notebook-root'),toolbar=document.querySelector('.print-toolbar');
function openNotebook(){
  pages.hidden=true;notebook.hidden=false;document.title='성화중학교 얼티미트 · 작성한 나의 전술 연구 노트';
  const h=document.createElement('h1');h.textContent='나의 전술 연구 노트';notebook.append(h);
  const p=document.createElement('p');p.textContent='청주 성화중학교 · 1학년 체육 · 개인 판단과 성찰 기록';notebook.append(p);
  const sections=[['처음 고른 패스 대상','firstTarget'],['나의 첫 근거','firstReason'],['생각이 바뀐 순간','revisedReason'],['우리 팀의 연결 작전','route'],['수비가 길을 막으면','alternative'],['존중하는 판정 대화','dialogue'],['다음 경기에서 실천할 일','exit']];
  for(const [label,key]of sections){const card=document.createElement('section');card.className='print-note';const title=document.createElement('strong');title.textContent=label;const content=document.createElement('div');content.textContent=window.__lessonNotebook?.notes?.[key]?.trim()||'작성하지 않았습니다.';card.append(title,content);notebook.append(card)}
  const heading=document.createElement('h2');heading.textContent='교사 관찰 기록';notebook.append(heading);
  const table=document.createElement('table');table.className='print-rubric';const tr=document.createElement('tr');for(const title of ['성취기준 관찰','선택한 지원 단계','관찰 근거']){const th=document.createElement('th');th.textContent=title;tr.append(th)}table.append(tr);
  for(const r of LESSON.rubric){const row=document.createElement('tr'),lvl=window.__lessonNotebook?.rubric?.[r.name];const level={strong:'스스로 근거 설명',developing:'도움을 받아 설명',support:'다음 수업에서 지원'}[lvl]||'관찰 전';for(const value of [`[${r.standard}] ${r.name}`,level,lvl?r[lvl]:'관찰 전']){const td=document.createElement('td');td.textContent=value;row.append(td)}table.append(row)}notebook.append(table);
  const note=document.createElement('p');note.className='print-source';note.textContent='이 기록은 이 기기의 브라우저에만 저장됩니다. 학생별 성적·서열을 자동으로 만들지 않습니다. 종이에 인쇄하거나 PDF로 저장한 뒤 직접 보관하세요.';notebook.append(note);
  if(toolbar)toolbar.querySelector('span').textContent='작성한 기록 · 이름과 학번 없이 인쇄하세요.';
}
function receiveNotes(state){if(!state||state.version!==2)return;window.__lessonNotebook=state;if(notebook&&!notebook.hidden){notebook.replaceChildren();openNotebook()}}
if(kind==='notebook'){
  openNotebook();
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.opener&&e.data?.type==='seonghwa-notebook-print')receiveNotes(e.data.state)});
  try{const raw=localStorage.getItem('seonghwa.ultimate.lesson.v2');if(raw)receiveNotes(JSON.parse(raw))}catch{}
}else if(template instanceof HTMLTemplateElement){pages.append(template.content.cloneNode(true));notebook.hidden=true}
else{notebook.hidden=true;document.getElementById('pages').innerHTML='<p id="print-error">자료를 찾을 수 없습니다. 수업 페이지에서 다시 선택해 주세요.</p>';}
document.getElementById('print-button').addEventListener('click',async()=>{await document.fonts.ready;window.print()});
if(params.get('print')==='1'&&template instanceof HTMLTemplateElement){window.addEventListener('load',async()=>{await document.fonts.ready;window.print()})}
