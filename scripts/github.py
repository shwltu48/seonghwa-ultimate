"""GitHub setup/status using Git Credential Manager; credentials stay in memory."""
import json,os,subprocess,sys,urllib.request,urllib.error
env=os.environ.copy();env['GIT_TERMINAL_PROMPT']='0'
proc=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,env=env)
if proc.returncode:raise SystemExit('GitHub credential unavailable; sign in with Git Credential Manager.')
credential=dict(line.split('=',1) for line in proc.stdout.splitlines() if '=' in line)
token=credential.get('password')
if not token:raise SystemExit('No GitHub token is available.')

def api(path,method='GET',body=None):
    req=urllib.request.Request('https://api.github.com'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'seonghwa-lesson-builder'})
    try:
        with urllib.request.urlopen(req,timeout=30) as res:
            raw=res.read();return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        detail=json.loads(err.read()).get('message','API error')
        raise RuntimeError(f'HTTP {err.code}: {detail}') from None

action=sys.argv[1]
name=sys.argv[2] if len(sys.argv)>2 else 'seonghwa-ultimate'
owner=api('/user')['login']
assert owner=='shwltu48',f'Unexpected GitHub account: {owner}'
base=f'/repos/{owner}/{name}'
if action=='inspect':
    try:
        repo=api(base)
        print(json.dumps({k:repo.get(k) for k in ['full_name','html_url','description','size','default_branch','has_pages','permissions']},ensure_ascii=False))
    except RuntimeError as err:print(str(err))
elif action=='create':
    try:api(base)
    except RuntimeError as err:
        if 'HTTP 404:' not in str(err):raise
        repo=api('/user/repos','POST',{'name':name,'description':'청주 성화중학교 1학년 얼티미트 45분 수업 · 학습자료와 활동지','private':False,'auto_init':False})
        print(json.dumps({'created':repo['full_name'],'url':repo['html_url']}))
    else:raise SystemExit('Repository already exists; inspect before changing it.')
elif action=='pages':
    try:page=api(base+'/pages')
    except RuntimeError as err:
        if 'HTTP 404:' not in str(err):raise
        page=api(base+'/pages','POST',{'build_type':'workflow'})
    else:
        if page.get('build_type')!='workflow':page=api(base+'/pages','PUT',{'build_type':'workflow'})
    print(json.dumps({k:page.get(k) for k in ['html_url','status','build_type']}))
elif action=='status':
    runs=api(base+'/actions/runs?per_page=3')
    print(json.dumps([{'id':r['id'],'status':r['status'],'conclusion':r['conclusion'],'url':r['html_url'],'sha':r['head_sha']} for r in runs['workflow_runs']]))
    try:
        page=api(base+'/pages');print(json.dumps({k:page.get(k) for k in ['html_url','status','build_type']}))
    except RuntimeError as err:print(str(err))
elif action=='jobs':
    runs=api(base+'/actions/runs?per_page=1')['workflow_runs']
    if runs:
        jobs=api(base+f'/actions/runs/{runs[0]["id"]}/jobs')['jobs']
        print(json.dumps([{'name':j['name'],'conclusion':j['conclusion'],'steps':j['steps']} for j in jobs]))
else:raise SystemExit('Use inspect, create, pages, status, or jobs')
