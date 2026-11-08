"""Build static lesson data, printable HTML and four verified PDF downloads."""
import json
import html
from pathlib import Path
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
D = json.loads((ROOT / 'lesson.json').read_text(encoding='utf-8'))
e = html.escape

def court(blank=False):
    players = ''
    if not blank:
        positions = [('나',23,70),('A',43,71),('B',56,26),('C',81,58)]
        for label,x,y in positions:
            x,y=x*6,y*2.7
            players += f'<circle class="attacker" cx="{x}" cy="{y}" r="17"/><text class="at" x="{x}" y="{y+5}" text-anchor="middle">{label}</text>'
        for label,x,y in [('①',36,55),('②',66,64)]:
            x,y=x*6,y*2.7
            players += f'<rect class="defender" x="{x-16}" y="{y-16}" width="32" height="32"/><text class="dt" x="{x}" y="{y+5}" text-anchor="middle">{label}</text>'
    return f'''<div class="court-wrap"><svg class="court" viewBox="0 0 600 270" role="img" aria-label="얼티미트 전술 코트"><rect class="line" x="2" y="2" width="596" height="266"/><rect class="zone" x="2" y="2" width="76" height="266"/><rect class="zone" x="522" y="2" width="76" height="266"/><text x="560" y="22" text-anchor="middle" font-size="10">공격 →</text><text x="560" y="39" text-anchor="middle" font-size="10">엔드존</text>{players}</svg></div>'''

def sheet(content,kind,num):
    return f'<section class="sheet" data-kind="{kind}"><div class="print-header"><span>{D["school"]} · 1학년 체육</span><span>얼티미트 / {kind}</span></div><div class="sheet-content">{content}</div><div class="page-footer"><span>빈 공간을 찾아라! · 우리 팀 얼티미트 작전</span><span>{kind} {num} / 2</span></div></section>'

def lines(cls=''):
    return f'<div class="answer-lines {cls}"><span></span><span></span></div>'

learning = []
learning.append(sheet(f'''<p class="kicker">LESSON 01 · 교실 전략 수업 · 45분</p><h1>{D['title']}<br>{D['subtitle']}</h1><div class="soft"><strong>오늘의 학습 목표</strong><ol>{''.join('<li>'+e(g)+'</li>' for g in D['goals'])}</ol></div><h2>01. 좋은 작전은 규칙에서 시작된다</h2><div class="rule-grid">{''.join('<div class="rule"><h3>'+str(i+1)+'. '+r['title']+'</h3><p>'+r['body']+'</p></div>' for i,r in enumerate(D['rules']))}</div><h2>02. 경기 전에 기억할 세 가지</h2><p><strong>패스 길</strong>이 열려 있는가? <strong>수비</strong>가 어디에 있는가? 내가 연결할 수 있는 <strong>거리</strong>인가?</p><p class="small">교실에서는 규칙과 전략을 탐구합니다. 패스·캐치 기능과 실제 안전한 경기 수행은 후속 실기 수업에서 확인합니다.</p>''','학습자료',1))
learning.append(sheet(f'''<p class="kicker">READ THE SPACE</p><h1>패스 다음의 움직임까지.</h1><p>그림을 보고 A·B·C 중 패스할 대상을 선택하세요. 수비 위치와 패스 거리를 근거로 설명해 봅시다.</p>{court()}<p class="legend">● 공격수 / □ 수비수 / 나: 디스크 소유자 / 공격 방향: 오른쪽</p><p class="small">교실 탐구용 4 대 2 정지 장면. 공식 경기 인원·경기장 비율을 나타내지 않습니다.</p><div class="columns"><div><h2>공간을 여는 세 행동</h2><ol><li>수비와 겹치지 않는 패스 길 찾기</li><li>받을 수 있는 빈 공간으로 이동하기</li><li>패스 후 다시 연결할 위치로 이동하기</li></ol></div><div><h2>서로를 존중하는 대화</h2><ol><li>내가 본 장면과 근거 설명하기</li><li>상대가 본 장면 끝까지 듣기</li><li>규칙을 확인하고 재개 방법 정하기</li></ol></div></div><h2>모둠 도전: 세 번의 패스로 연결하기</h2><p>공격수 4명과 수비수 2명을 배치하고 세 번의 패스로 엔드존에 연결하는 계획을 그립니다. 실선은 패스, 점선은 선수 이동으로 표시하고, 수비가 길을 막을 때의 대안도 준비하세요.</p><p class="small">위 인원과 패스 횟수는 전술 설계 과제의 조건이며 공식 경기 규칙이 아닙니다.</p><div class="source"><strong>근거 자료</strong><p>교육부 고시 제2022-33호 별책 11, 체육과 교육과정. [9체02-12], [9체02-26] 중심, [9체02-11] 복습 연결. 원문은 중등 성취기준 MCP로 확인(원문 PDF 35~36쪽).</p><p>WFDF 2025–2028 Basic Rules (한국어 요약)<br><a href="{D['sources'][1]['url']}">{D['sources'][1]['url']}</a></p></div>''','학습자료',2))

worksheet = []
worksheet.append(sheet(f'''<p class="kicker">WORKSHEET 01 · 개인 판단 → 짝 설명</p><h1>나는 누구에게 패스할까?</h1><div class="identity">1학년 _____반 _____번 이름 _______________　 모둠 __________</div><h2>1. 첫 판단 · 5분</h2><p>아래 그림에서 나는 ( A / B / C )에게 패스하겠다. 그 이유는?</p>{lines('short')}<h2>2. 규칙 챌린지 · 8분</h2><table class="quiz-table"><thead><tr><th>장면을 읽고 판단하세요.</th><th>내 판단</th></tr></thead><tbody>{''.join('<tr><td>'+str(i+1)+'. '+q['q']+'</td><td>O / X</td></tr>' for i,q in enumerate(D['quiz']))}</tbody></table><p class="small">가장 헷갈린 문항 번호와 이유: ____________________________________________________</p><h2>3. 패스 길을 읽어라 · 12분</h2>{court()}<p class="legend">● 공격수 / □ 수비수 / 나: 디스크 소유자. 공격 방향 →. 교실 탐구용 정지 장면.</p><p>다시 선택한 대상: ______　근거(수비 위치·거리·패스 길):</p>{lines('short')}<p>패스한 뒤 나는 어디로 움직일까? _______________________________________________</p>''','학생 활동지',1))
worksheet.append(sheet(f'''<p class="kicker">WORKSHEET 02 · 모둠 작전 → 개인 성찰</p><h1>우리 팀의 다음 선택.</h1><div class="identity">모둠 __________　내 역할: 전술 / 기록 / 발표 / 공정성 / 공간 관찰</div><h2>4. 세 번의 패스 작전 · 모둠 활동 12분</h2><p class="small">공격수 4명(○)·수비수 2명(□)을 배치하세요. 실선 화살표 = 패스, 점선 화살표 = 이동.<br>세 번의 패스로 엔드존까지 연결하세요. 인원·횟수는 이번 설계 과제 조건입니다.</p>{court(True)}<p>수비가 패스 길을 막으면 우리는 어떻게 바꿀까?</p>{lines('short')}<p class="small"><strong>갈등 상황:</strong> {D['conflict']}</p><p class="dialogue">나: “내가 본 상황은 ____________________________________________________.”<br>상대: “내가 본 상황은 __________________________________________________.”<br>함께: “규칙을 확인하고 ______________________________________ 다시 시작하자.”</p><h2>5. 자기평가와 퇴장 질문 · 8분</h2><table class="rubric"><tr><th>오늘의 나</th><th>스스로 가능</th><th>도움받아 가능</th><th>더 연습</th></tr><tr><td>패스 선택 이유를 설명했다.</td><td>□</td><td>□</td><td>□</td></tr><tr><td>이동과 대안 작전을 제안했다.</td><td>□</td><td>□</td><td>□</td></tr><tr><td>다른 의견을 듣고 존중했다.</td><td>□</td><td>□</td><td>□</td></tr></table><p>다음 실제 경기에서 실천할 공간 활용 전략 한 가지:</p>{lines('short')}<p>다음 실제 경기에서 실천할 존중의 행동 한 가지:</p>{lines('short')}''','학생 활동지',2))

teacher = []
teacher.append(sheet(f'''<p class="kicker">TEACHER GUIDE · 학생에게 배부하지 않는 해설</p><h1>45분, 경기 판단을 배우다.</h1><p>대상: 청주 성화중학교 1학년 / 기본 패스·캐치 학습 후 교실 수업<br>준비: 교사 화면, 학생당 활동지 2쪽, 필기도구 / 4~5명 모둠</p><table class="flow"><tr><th>단계</th><th>시간</th><th>진행과 발문</th></tr>{''.join('<tr><td>'+t['title']+'</td><td>'+str(t['minutes'])+'분</td><td>'+t['teacher']+'</td></tr>' for t in D['timeline'])}</table><h2>성취기준 연결</h2>{''.join('<p class="small"><strong>['+s['code']+']</strong> '+s['text']+'<br>→ '+s['use']+'</p>' for s in D['standards'])}<h2>규칙 챌린지 정답과 지도 초점</h2>{''.join('<p class="small"><strong>'+str(i+1)+'. '+('O' if q['answer'] else 'X')+'</strong> '+q['why']+'</p>' for i,q in enumerate(D['quiz']))}<p class="small">성취기준 출처: 교육부 고시 제2022-33호 별책 11, PDF 35~36쪽. 중학교 1~3학년군 성취기준을 1학년 수업으로 재구성했습니다.</p>''','교사용 해설',1))
teacher.append(sheet(f'''<p class="kicker">FEEDBACK & ASSESSMENT</p><h1>선택보다, 선택의 근거.</h1><h2>전술판 예시 해설</h2>{''.join('<p class="small"><strong>'+c['label']+'</strong> — '+c['feedback']+'</p>' for c in D['choices'])}<p class="small">B만 정답으로 채점하지 않습니다. A를 고르더라도 수비 위치, 패스 각도, 거리, 동료 이동을 근거로 설명하면 타당한 판단으로 인정합니다.</p><h2>모둠 작전 예시</h2><p class="small">나 → 왼쪽 위 빈 공간으로 이동한 B → 가운데로 이동한 A → 오른쪽 엔드존으로 이동한 C. 패스 후 ‘나’는 뒤쪽 지원 공간으로 이동합니다. 수비가 B를 막으면 A로 짧게 연결하는 대안을 생각합니다. 예상 이동이므로 수비 반응에 따라 수정해야 합니다.</p><h2>판정 대화 예시</h2><div class="soft small">“잡기 전에 내 팔에 접촉이 있었다고 봤어.”<br>“나는 접촉하지 않았다고 느꼈어. 네 설명을 들어 볼게.”<br>“서로 다르게 봤구나. 규칙을 확인하자. 이 장면에서는 이전 던진 선수에게 디스크를 돌려주고 체크 후 재개하자.”</div><p class="small">이는 동의하지 않는 파울 판정의 일반적인 재개 예시입니다. 모든 파울에 일괄 적용하지 않고 상황별 규칙을 확인합니다. 학생 역할 대화에서는 관점 설명·경청·규칙 근거를 관찰합니다.</p><h2>형성평가 관찰 기준</h2><table class="rubric"><tr><th>관찰 요소</th><th>도달 모습</th><th>도움이 필요할 때의 발문</th></tr><tr><td>전략 판단</td><td>수비 위치·패스 길·거리 중 2가지 이상으로 설명</td><td>“패스 길에 누가 있나요?”</td></tr><tr><td>작전 설계</td><td>패스·이동을 구분하고 수비 반응에 대한 대안 제시</td><td>“그 길이 막히면 어디가 열릴까요?”</td></tr><tr><td>협력·존중</td><td>상대 의견을 듣고 상황과 규칙을 근거로 대화</td><td>“상대가 본 장면을 다시 말해 볼까요?”</td></tr></table><p class="small">이번 수업은 형성평가입니다. 승패·투척 거리·캐치 성공률을 평가하지 않습니다. 다음 실기 수업에서 전략 적용과 안전한 경기 수행을 추가로 관찰하세요.</p><div class="source"><strong>규칙 근거:</strong> WFDF 2025–2028 Basic Rules.<br><a href="{D['sources'][1]['url']}">{D['sources'][1]['url']}</a></div>''','교사용 해설',2))

pages = {'learning': learning, 'worksheet': worksheet, 'teacher': teacher}
SITE.mkdir(exist_ok=True)
(SITE/'lesson-data.js').write_text('window.LESSON = '+json.dumps(D,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
templates=''.join(f'<template id="{kind}">{"".join(items)}</template>' for kind,items in pages.items())
print_html='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>성화중학교 얼티미트 인쇄 자료</title><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="print.css"><script src="print.js" defer></script></head><body><div class="print-toolbar"><a href="index.html#downloads">수업으로 돌아가기</a><button id="print-button">인쇄 / PDF로 저장</button><span>용지 A4 · 배율 100%</span></div><main id="pages"></main>'''+templates+'</body></html>'
(SITE/'print.html').write_text(print_html,encoding='utf-8')

def main():
    pdf_dir=SITE/'pdf';pdf_dir.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome',headless=True)
        page=browser.new_page()
        for kind in pages:
            page.goto((SITE/'print.html').as_uri()+'?type='+kind)
            page.evaluate('document.fonts.ready')
            assert page.locator('.sheet').count()==2
            overflow=page.locator('.sheet').evaluate_all('(els)=>els.map(e=>({height:e.scrollHeight,client:e.clientHeight}))')
            assert all(v['height']<=v['client']+1 for v in overflow), (kind,overflow)
            page.pdf(path=str(pdf_dir/f'{kind}.pdf'),format='A4',print_background=True,prefer_css_page_size=True)
            reader=PdfReader(pdf_dir/f'{kind}.pdf')
            assert len(reader.pages)==2, (kind,len(reader.pages))
            assert all('성화중학교' in pg.extract_text() for pg in reader.pages)
            print(kind, '2 pages OK')
        browser.close()
    writer=PdfWriter()
    for kind in pages: writer.append(str(pdf_dir/f'{kind}.pdf'))
    writer.add_metadata({'/Title':'성화중학교 얼티미트 1차시 전체 세트','/Author':'성화중학교 체육 수업자료'})
    writer.write(pdf_dir/'complete-set.pdf')
    print('Complete set: 6 pages')

if __name__=='__main__':main()
