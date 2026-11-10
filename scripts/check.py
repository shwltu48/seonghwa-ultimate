"""Dependency-free publication checks; does not modify sources."""
import json,re
from pathlib import Path
from urllib.parse import urlsplit,unquote
root=Path(__file__).resolve().parents[1]
site=root/'site'
data=json.loads((root/'lesson.json').read_text(encoding='utf-8'))
assert sum(s['minutes'] for s in data['timeline'])==45
assert len(data['quiz'])==4
assert '성화중학교' in data['school']
embedded=(site/'lesson-data.js').read_text(encoding='utf-8')
assert json.loads(embedded.removeprefix('window.LESSON = ').rstrip().removesuffix(';'))==data
for path in site.rglob('*.html'):
    text=path.read_text(encoding='utf-8')
    for target in re.findall(r'(?:src|href)="([^"]+)"',text):
        parsed=urlsplit(target)
        if parsed.scheme or not parsed.path:continue
        assert (path.parent/unquote(parsed.path)).is_file(),f'Missing {target} in {path.name}'
for kind in ['learning','worksheet','teacher','extension','complete-set']:
    file=site/'pdf'/f'{kind}.pdf'
    assert file.stat().st_size>10000 and file.read_bytes().startswith(b'%PDF-')
assert (site/'assets'/'NotoSansKR.ttf').stat().st_size>100000
assert (site/'assets'/'OFL.txt').is_file()
print('PASS: lesson timing, shared content, local links, PDF signatures, font and license')
