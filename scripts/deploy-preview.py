# Historical helper preserved. Owner requires GitHub-only publishing.
raise SystemExit('Disabled: publish LifeCity through GitHub only. See docs/deployment.md.')

"""Publish only compiled browser demo to the separately provisioned LifeCity site."""
from pathlib import Path
import hashlib,json,os,urllib.request,urllib.error,zipfile
ROOT=Path(__file__).resolve().parents[1]
temporary=Path('/tmp/lifecity-netlify-site.json')
if temporary.exists():site=json.loads(temporary.read_text())
else:
 previous=json.loads((ROOT/'docs/evidence/deployment.json').read_text());site={'id':previous['site_id'],'name':previous['site_name'],'ssl_url':previous['site_url']}
assert site['name']=='lifecity-3d-mdaar21'
assert site['id']=='737b05ce-e06f-4e34-95d1-3269ce6ce46c'
assert (ROOT/'dist/sw.js').exists() and (ROOT/'dist/_headers').exists()
archive=Path('/tmp/lifecity-preview.zip');files=[]
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted((ROOT/'dist').rglob('*')):
  if not path.is_file():continue
  name=path.relative_to(ROOT/'dist').as_posix()
  assert '.env' not in name and not name.startswith(('server/','.data/','supabase/'))
  z.write(path,name);files.append({'path':name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
data=archive.read_bytes()
request=urllib.request.Request(f'https://api.netlify.com/api/v1/sites/{site["id"]}/deploys?title=LifeCity%203D%20local%20guest%20preview',data=data,headers={'Authorization':'Bearer '+os.environ['NETLIFY_AUTH_TOKEN'],'Content-Type':'application/zip'},method='POST')
try:
 with urllib.request.urlopen(request,timeout=60) as response:deploy=json.load(response)
except urllib.error.HTTPError as error:
 detail=json.loads(error.read().decode()).get('error',str(error))
 blocked={'site_id':site['id'],'site_name':site['name'],'site_url':site['ssl_url'],'state':'provisioned_not_deployed','published':False,'error_status':error.code,'error':detail,'automatic_purchase_performed':False}
 (ROOT/'docs/evidence/deployment.json').write_text(json.dumps(blocked,indent=2)+'\n');print(json.dumps(blocked));raise SystemExit(1)
safe={'site_id':site['id'],'site_name':site['name'],'site_url':site['ssl_url'],'deploy_id':deploy['id'],'state':deploy['state'],'created_at':deploy.get('created_at'),'zip_bytes':len(data),'mode':'browser-only guest demo; no hosted Supabase connected','files':files}
(ROOT/'docs/evidence/deployment.json').write_text(json.dumps(safe,indent=2)+'\n');print(json.dumps({k:v for k,v in safe.items() if k!='files'}))
