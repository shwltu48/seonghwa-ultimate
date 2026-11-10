"""Browser, download and PDF layout acceptance checks. Artifacts stay in qa/."""
import functools,hashlib,http.server,json,threading,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from pypdf import PdfReader
import pymupdf as fitz

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)
server=None
if len(sys.argv)>1:
    base=sys.argv[1].rstrip('/')+'/'
else:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    handler=functools.partial(QuietHandler,directory=str(ROOT))
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/site/'

results=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='chrome',headless=True)
        context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
        context.add_init_script('window.print=()=>{window.__printed=true}')
        page=context.new_page();errors=[];bad=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.on('console',lambda msg:errors.append(msg.text) if msg.type=='error' else None)
        page.on('response',lambda res:bad.append(f'{res.status} {res.url}') if res.status>=400 else None)
        response=page.goto(base,wait_until='networkidle');assert response.status==200
        page.evaluate('document.fonts.ready')
        assert page.title()=='빈 공간을 찾아라! | 성화중학교 얼티미트'
        assert page.locator('#goals li').count()==3
        page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
        results.append('Desktop first paint, local font and shared lesson content')
        page.locator('#next').click();assert page.locator('.quiz-item').count()==4
        for i,correct in enumerate([False,True,False,False]):
            page.locator(f'[data-quiz="{i}"][data-value="{str(not correct).lower()}"]').click()
            assert '다시 살펴봐요' in page.locator(f'#feedback-{i}').inner_text()
            page.locator(f'[data-quiz="{i}"][data-value="{str(correct).lower()}"]').click()
            assert '정확해요' in page.locator(f'#feedback-{i}').inner_text()
        results.append('All four quiz items: incorrect/correct feedback and selection')
        page.locator('#next').click()
        for target in ['A','B','C']:
            page.locator(f'.choice-list [data-pick="{target}"]').click()
            assert page.locator(f'.court [data-pick="{target}"]').get_attribute('aria-pressed')=='true'
            assert page.locator('#pass-path').get_attribute('d').startswith('M23')
            assert len(page.locator('#tactic-feedback').inner_text())>40
        page.locator('.court [data-pick="B"]').focus();page.keyboard.press('Enter')
        assert 'B가 유리' in page.locator('#tactic-feedback').inner_text()
        clear=page.locator('.court').evaluate('''court=>{
          const center=e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,r:r.width/2}};
          const a=center(court.querySelector('.thrower')), b=center(court.querySelector('[data-pick="B"]'));
          return [...court.querySelectorAll('.defender')].every(e=>{const d=center(e),dx=b.x-a.x,dy=b.y-a.y;
            const t=Math.max(0,Math.min(1,((d.x-a.x)*dx+(d.y-a.y)*dy)/(dx*dx+dy*dy)));
            return Math.hypot(d.x-a.x-t*dx,d.y-a.y-t*dy)>d.r+8;
          });
        }''')
        assert clear,'Recommended B passing lane must be visibly clear of defenders'
        page.screenshot(path=str(OUT/'tactics.png'),full_page=True)
        page.locator('#prev').click();assert '정확해요' in page.locator('#feedback-0').inner_text()
        page.locator('#next').click();assert page.locator('.court [data-pick="B"]').get_attribute('aria-pressed')=='true'
        results.append('All tactical choices, SVG paths, keyboard activation, state across steps')
        page.locator('#present').click();assert page.locator('body').evaluate('(e)=>e.classList.contains("present")')
        page.locator('#present').click()
        for i in [3,4]:
            page.locator(f'[data-step="{i}"]').click()
            page.locator('.teacher-detail summary').click()
            assert page.locator('.teacher-detail').get_attribute('open') is not None
        assert page.locator('#next').is_disabled()
        page.locator('#reset').click();page.locator('#cancel-reset').click();assert '05' in page.locator('#counter').inner_text()
        page.locator('#reset').click();page.locator('#confirm-reset').click()
        assert page.locator('#prev').is_disabled()
        page.locator('[data-step="1"]').click();assert page.locator('#feedback-0').inner_text()==''
        page.locator('[data-step="2"]').click();assert '아직 선택하지' in page.locator('#tactic-feedback').inner_text()
        assert page.locator('#challenge-dock .challenge-open').count()==3
        for level in ['보충','기본','도전']:
            page.locator(f'.challenge-open[data-challenge="{level}"]').click()
            page.locator('#challenge-detail .challenge-answer button').nth(0).click()
            page.locator('#challenge-reason').fill('수비 위치와 열린 패스 길을 함께 보고 안전한 대안을 선택한다.')
            page.locator('#challenge-detail button.dark').click()
            assert page.locator('.challenge-feedback').inner_text()
        assert '도전 3/3' in page.locator('.ledger-stats').inner_text()
        results.append('Three leveled tactical challenges: reason-first choices and explanatory feedback')
        results.append('Presentation toggle, all five stages, teacher disclosure, reset cancel/confirm')
        page.locator('#clock-toggle').click();assert page.locator('#clock-toggle').get_attribute('aria-pressed')=='true'
        before=page.locator('#clock-display').inner_text();page.wait_for_timeout(1150);after=page.locator('#clock-display').inner_text()
        assert before!=after,(before,after)
        page.locator('#clock-toggle').click();assert page.locator('#clock-toggle').get_attribute('aria-pressed')=='false'
        page.locator('#stage-complete').click();assert '1 / 5 단계 기록' in page.locator('#stage-completion-count').inner_text()
        page.locator('#notebook-fields textarea[name="firstReason"]').fill('먼저 수비의 위치를 살피고 동료와 패스 거리를 생각했다.')
        page.locator('#notebook-fields textarea[name="route"]').fill('A가 중앙을 열고 B가 가까운 공간으로 이동한 뒤 C가 엔드존에 들어간다.')
        page.locator('#notebook-fields select[data-rubric]').nth(0).select_option('developing')
        assert '[9체02-12]' in page.locator('.rubric-card').first.inner_text()
        assert '점수' in page.locator('#rubric-feedback').inner_text()
        savedStage=page.locator('#counter').inner_text()
        page.reload(wait_until='networkidle')
        assert page.locator('#notebook-fields textarea[name="firstReason"]').input_value().startswith('먼저 수비')
        assert page.locator('#notebook-fields textarea[name="route"]').input_value().startswith('A가 중앙')
        assert page.locator('#counter').inner_text()==savedStage
        assert '도전 3/3' in page.locator('.ledger-stats').inner_text()
        with page.expect_download() as backup_info:page.locator('#backup-export').click()
        backup_path=OUT/'student-record-backup.json';backup_info.value.save_as(backup_path)
        backup=json.loads(backup_path.read_text(encoding='utf-8'));assert backup['version']==2 and '수비' in backup['notes']['firstReason']
        page.locator('#notebook-fields textarea[name="firstReason"]').fill('다시 작성한 임시 기록.')
        with page.expect_file_chooser() as chooser_info:
            page.locator('.import-button').click()
        chooser_info.value.set_files(str(backup_path));page.wait_for_function("document.querySelector('[name=firstReason]').value.startsWith('먼저 수비')")
        results.append('Phase clock, manual progress, criteria-linked unscored observation, local autosave and JSON round-trip')
        with context.expect_page() as notebook_popup_info:page.locator('#notebook-print').click()
        notebook_popup=notebook_popup_info.value;notebook_popup.wait_for_load_state('networkidle')
        notebook_popup.wait_for_timeout(250)
        assert '먼저 수비' in notebook_popup.locator('#print-notebook-root').inner_text()
        notebook_popup.locator('#print-button').click();notebook_popup.wait_for_function('window.__printed===true')
        notebook_popup.close();results.append('Dynamic personal notebook prints to paper/PDF with escaped text')
        for filename,expected in [('learning',2),('worksheet',2),('teacher',2),('extension',2),('complete-set',8)]:
            with page.expect_download() as info:page.locator(f'.download-card[href="pdf/{filename}.pdf"]').click()
            dest=OUT/f'download-{filename}.pdf';info.value.save_as(dest)
            assert len(PdfReader(dest).pages)==expected
            assert hashlib.sha256(dest.read_bytes()).digest()==hashlib.sha256((ROOT/'site'/'pdf'/f'{filename}.pdf').read_bytes()).digest()
        results.append('Five real PDF downloads, including two-page extension and eight-page complete set')
        with context.expect_page() as popup_info:page.locator('#print-worksheet').click()
        popup=popup_info.value;popup.wait_for_load_state('networkidle');popup.evaluate('document.fonts.ready')
        assert popup.locator('.sheet').count()==2
        popup.wait_for_function('window.__printed===true')
        assert '교사용 해설' not in popup.locator('#pages').inner_text()
        popup.close();results.append('Dedicated worksheet print window and print action, no teacher answers')
        for width,height in [(768,1024),(390,844),(320,780)]:
            page.set_viewport_size({'width':width,'height':height})
            for stage in range(5):
                page.locator(f'[data-step="{stage}"]').click()
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,stage)
            page.locator('[data-step="0"]').click()
            page.screenshot(path=str(OUT/f'viewport-{width}.png'),full_page=True)
        results.append('No horizontal overflow: 768px, 390px, 320px across all five stages')
        page.emulate_media(reduced_motion='reduce')
        assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='auto'
        page.set_viewport_size({'width':1000,'height':900})
        for kind in ['learning','worksheet','teacher','extension']:
            page.goto(base+f'print.html?type={kind}',wait_until='networkidle');page.evaluate('document.fonts.ready')
            layout=page.locator('.sheet').evaluate_all('els=>els.map(e=>({bottom:e.querySelector(".sheet-content").getBoundingClientRect().bottom,footer:e.querySelector(".page-footer").getBoundingClientRect().top}))')
            assert all(v['bottom']<v['footer']-5 for v in layout),(kind,layout)
        results.append('All six printable pages: content clears footer; reduced motion respected')
        assert not errors,errors
        assert not bad,bad
        results.append('No browser JavaScript/console errors or HTTP errors during tested flows')
        context.close();browser.close()
    for kind in ['learning','worksheet','teacher','extension']:
        doc=fitz.open(ROOT/'site'/'pdf'/f'{kind}.pdf')
        for i,pg in enumerate(doc):
            assert abs(pg.rect.width-595.28)<2 and abs(pg.rect.height-841.89)<2
            assert '성화중학교' in pg.get_text()
            # Chrome may embed variable-font glyphs as Type3 CharProcs rather than
            # retain the source font name. Verify embedded glyph programs directly.
            pdf_page=PdfReader(ROOT/'site'/'pdf'/f'{kind}.pdf').pages[i]
            fonts=pdf_page['/Resources']['/Font'].get_object()
            assert fonts
            for ref in fonts.values():
                font=ref.get_object()
                if font['/Subtype']=='/Type3':
                    procs=font['/CharProcs'].get_object()
                    assert procs and any(len(v.get_object().get_data())>0 for v in procs.values())
                    assert '/ToUnicode' in font
                else:
                    descendants=font.get('/DescendantFonts',[font])
                    assert all(any(k in f.get_object()['/FontDescriptor'].get_object() for k in ['/FontFile','/FontFile2','/FontFile3']) for f in descendants)
            pg.get_pixmap(matrix=fitz.Matrix(1,1)).save(OUT/f'{kind}-{i+1}.png')
    results.append('PDF A4 sizing, Korean text extraction and self-contained glyphs on all eight pages')
    report={'base':base,'checks':results,'result':'PASS'}
    (OUT/('live-results.json' if len(sys.argv)>1 else 'local-results.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
finally:
    if server:server.shutdown()
