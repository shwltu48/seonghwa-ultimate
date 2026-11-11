'use strict';
(() => {
  const KEY='seonghwa.ultimate.drawing.v1', NS='http://www.w3.org/2000/svg';
  const initial=()=>({players:[[130,260],[310,240],[310,100],[510,180],[230,280],[440,230]],strokes:[]});
  let model=initial(), undo=[], redo=[], mode='pass', gesture=null, root, svg;
  const clone=x=>JSON.parse(JSON.stringify(x));
  function valid(x){return x && Array.isArray(x.players)&&x.players.length===6&&x.players.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=18&&p[0]<=682&&p[1]>=45&&p[1]<=342)&&Array.isArray(x.strokes)&&x.strokes.length<=200&&x.strokes.every(s=>['pass','move'].includes(s.mode)&&Array.isArray(s.points)&&s.points.length<=2000&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=700&&p[1]>=0&&p[1]<=360));}
  try{const x=JSON.parse(localStorage.getItem(KEY));if(valid(x))model=x;}catch{}
  function status(text){root.querySelector('[role=status]').textContent=text;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(model));status('이 기기에 작전 그림 저장됨 · 선 '+model.strokes.length+'개');}catch{status('자동 저장에 실패했습니다. PNG로 내려받아 보관하세요.');}}
  function checkpoint(){undo.push(clone(model));if(undo.length>40)undo.shift();redo=[];}
  function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;}
  function paint(){
    svg.replaceChildren();
    svg.append(node('rect',{width:700,height:360,fill:'#edf3e5'}),node('rect',{x:590,y:36,width:100,height:314,fill:'#d7eab5'}),node('rect',{x:10,y:36,width:680,height:314,rx:4,fill:'none',stroke:'#81977a','stroke-width':2}),node('path',{d:'M590 36V350',stroke:'#81977a','stroke-dasharray':'7 5'}),node('text',{x:20,y:24,fill:'#233d2c','font-size':15,'font-family':'sans-serif'},'성화중학교 · 우리 팀의 작전'),node('text',{x:530,y:24,fill:'#233d2c','font-size':14,'font-family':'sans-serif'},'공격 방향 →'),node('text',{x:612,y:60,fill:'#426037','font-size':14,'font-family':'sans-serif'},'엔드존'));
    model.strokes.forEach(s=>{
      svg.append(node('polyline',{points:s.points.map(p=>p.join(',')).join(' '),fill:'none',stroke:s.mode==='pass'?'#234c3a':'#b45022','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round',...(s.mode==='move'?{'stroke-dasharray':'9 7'}:{})}));
      if(s.points.length>1){const end=s.points.at(-1);let start=s.points.at(-2);for(let i=s.points.length-2;i>=0;i--){start=s.points[i];if(Math.hypot(end[0]-start[0],end[1]-start[1])>12)break;}const angle=Math.atan2(end[1]-start[1],end[0]-start[0]);const arms=[-.5,.5].map(a=>[end[0]-12*Math.cos(angle+a),end[1]-12*Math.sin(angle+a)]);svg.append(node('polyline',{points:[arms[0],end,arms[1]].map(p=>p.join(',')).join(' '),fill:'none',stroke:s.mode==='pass'?'#234c3a':'#b45022','stroke-width':3}));}
    });
    model.players.forEach(([x,y],i)=>{const label=['나','A','B','C','①','②'][i];const g=node('g',{'data-player':i,tabindex:0,role:'button','aria-label':`${i<4?'공격수':'수비수'} ${label}. 방향키로 이동`,transform:`translate(${x} ${y})`});g.append(node(i<4?'circle':'rect',i<4?{r:17,fill:'#122838'}:{x:-17,y:-17,width:34,height:34,rx:4,fill:'#aa452d'}),node('text',{'text-anchor':'middle',dy:6,fill:'white','font-size':17,'font-family':'sans-serif','pointer-events':'none'},label));svg.append(g);});
    root.querySelector('[data-action=undo]').disabled=!undo.length;root.querySelector('[data-action=redo]').disabled=!redo.length;
  }
  function point(e){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return [Math.max(0,Math.min(700,p.x)),Math.max(0,Math.min(360,p.y))];}
  const bounded=p=>[Math.max(18,Math.min(682,p[0])),Math.max(45,Math.min(342,p[1]))];
  function end(e,cancel=false){if(!gesture||e.pointerId!==gesture.id)return;if(cancel)model=gesture.before;else if(gesture.player===null&&model.strokes.at(-1).points.length<2)model.strokes.pop();gesture=null;paint();save();}
  function mount(){
    if(window.lessonControl.getStage()!==3)return;
    const court=document.querySelector('#stage .court');if(!court||document.getElementById('tactics'))return;
    court.previousElementSibling.textContent='웹 코트 위에 우리 팀 작전을 그리세요.';
    root=document.createElement('section');root.id='tactics';root.className='tactics';root.setAttribute('aria-label','직접 그리는 전술판');
    root.innerHTML='<div class="tactics-tools" role="group" aria-label="전술판 도구"><button data-mode="pass" aria-pressed="true">실선 · 패스</button><button data-mode="move" aria-pressed="false">점선 · 이동</button><button data-mode="player" aria-pressed="false">선수 배치</button><button data-action="undo">되돌리기</button><button data-action="redo">다시 하기</button><button data-action="clear">선 지우기</button><button data-action="expand">크게 보기</button><button data-action="download">PNG 저장 ↓</button></div><p class="tactics-status" role="status" aria-live="polite"></p><p class="tactics-help">마우스·터치·펜슬로 그리세요. 선수 배치를 선택하면 선수를 끌어 옮길 수 있습니다. 키보드는 선수에 Tab으로 이동한 뒤 방향키를 누르세요. 그림은 이 브라우저에 별도로 저장됩니다. 노트 백업에는 포함되지 않으니 PNG로 보관하세요.</p>';
    svg=node('svg',{viewBox:'0 0 700 360',role:'group','aria-label':'그리기 코트. 공격 방향 오른쪽. 실선은 패스, 점선은 이동.'});root.insertBefore(svg,root.querySelector('[role=status]'));court.nextElementSibling?.remove();court.replaceWith(root);
    root.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.onclick=()=>{mode=b.dataset.mode;root.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));status(mode==='player'?'선수를 끌어 위치를 바꾸세요.':'코트에 '+(mode==='pass'?'패스 실선':'이동 점선')+'을 그리세요.');};});
    root.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
      const action=b.dataset.action;if(action==='expand'){const wide=root.parentElement.classList.toggle('tactics-expanded');b.textContent=wide?'작게 보기':'크게 보기';return;}
      if(action==='download'){download();return;}
      if(action==='undo'&&undo.length){redo.push(clone(model));model=undo.pop();}
      if(action==='redo'&&redo.length){undo.push(clone(model));model=redo.pop();}
      if(action==='clear'){checkpoint();model.strokes=[];}
      paint();save();
    });
    svg.addEventListener('pointerdown',e=>{if(gesture||e.button!==0||!e.isPrimary)return;const target=e.target.closest('[data-player]');if(mode==='player'&&!target)return;if(mode!=='player'&&model.strokes.length>=200){status('선은 최대 200개입니다. 선을 지운 뒤 계속하세요.');return;}e.preventDefault();const before=clone(model);checkpoint();gesture={id:e.pointerId,before,player:mode==='player'?Number(target.dataset.player):null};svg.setPointerCapture(e.pointerId);if(gesture.player===null)model.strokes.push({mode,points:[point(e)]});paint();});
    svg.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();const p=point(e);if(gesture.player!==null)model.players[gesture.player]=bounded(p);else{const s=model.strokes.at(-1),last=s.points.at(-1);if(s.points.length<2000&&Math.hypot(p[0]-last[0],p[1]-last[1])>1)s.points.push(p);}paint();});
    svg.addEventListener('pointerup',e=>end(e));svg.addEventListener('pointercancel',e=>end(e,true));svg.addEventListener('lostpointercapture',e=>end(e,true));
    svg.addEventListener('keydown',e=>{const g=e.target.closest('[data-player]'),delta={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];if(!g||!delta)return;e.preventDefault();const i=Number(g.dataset.player);checkpoint();model.players[i]=bounded(model.players[i].map((n,j)=>n+delta[j]));paint();svg.querySelector(`[data-player="${i}"]`).focus();save();});
    paint();status('작전 그림 자동 저장 · 실선은 패스, 점선은 이동');
  }
  function download(){const copy=svg.cloneNode(true);copy.setAttribute('xmlns',NS);copy.setAttribute('width','1400');copy.setAttribute('height','720');const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'})),image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=720;canvas.getContext('2d').drawImage(image,0,0);URL.revokeObjectURL(url);canvas.toBlob(blob=>{if(!blob){status('이미지 저장에 실패했습니다. 다시 시도하세요.');return;}const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='seonghwa-team-tactics.png';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);status('작전 그림 PNG를 내려받았습니다.');},'image/png');};image.onerror=()=>{URL.revokeObjectURL(url);status('이미지 저장에 실패했습니다. 다시 시도하세요.');};image.src=url;}
  window.addEventListener('lesson:render',()=>{if(gesture){model=gesture.before;gesture=null;}mount();});mount();
})();
