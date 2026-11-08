'use strict';
const params=new URLSearchParams(location.search);
const kind=params.get('type')||'worksheet';
const template=document.getElementById(kind);
if(template instanceof HTMLTemplateElement){document.getElementById('pages').append(template.content.cloneNode(true));}
else{document.getElementById('pages').innerHTML='<p id="print-error">자료를 찾을 수 없습니다. 수업 페이지에서 다시 선택해 주세요.</p>';}
document.getElementById('print-button').addEventListener('click',async()=>{await document.fonts.ready;window.print();});
if(params.get('print')==='1' && template instanceof HTMLTemplateElement){window.addEventListener('load',async()=>{await document.fonts.ready;window.print();});}
