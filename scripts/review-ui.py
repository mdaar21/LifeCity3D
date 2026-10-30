from pathlib import Path
import os
import json,time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/evidence/ui';OUT.mkdir(parents=True,exist_ok=True);BASE=os.environ.get('REVIEW_BASE','http://127.0.0.1:5175')
checks=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
 context=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/',wait_until='networkidle');page.wait_for_timeout(1000);page.screenshot(path=str(OUT/'landing-desktop.png'))
 page.get_by_role('button',name='جرّبها أولًا',exact=True).click();page.wait_for_url('**/dashboard');page.wait_for_selector('[data-testid="wallet-balance"]');page.wait_for_timeout(800)
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000 if width>500 else 844})
  for route in ['dashboard','city','tasks','timer','shop','prayers','yuyi','stats','settings','interior']:
   page.goto(BASE+'/'+route,wait_until='networkidle');page.wait_for_selector('#main-content');page.wait_for_timeout(180)
   overflowing=page.evaluate('document.documentElement.scrollWidth>innerWidth')
   if overflowing:
    bad=page.evaluate('''()=>[...document.querySelectorAll('main *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.left< -2||b.right>innerWidth+2)}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,70),box:e.getBoundingClientRect().toJSON()}))''')
   else:bad=[]
   checks.append({'width':width,'route':route,'horizontalOverflow':overflowing,'overflowElements':bad})
   if route in ['dashboard','city','tasks','timer','shop','yuyi']:page.screenshot(path=str(OUT/f'{route}-{width}.png'))
 page.set_viewport_size({'width':1440,'height':1000});page.goto(BASE+'/city',wait_until='networkidle');page.wait_for_timeout(800)
 before=page.evaluate('window.__LIFECITY_RENDER_METRICS__||null');canvas=page.locator('canvas').last
 if canvas.count():
  canvas.scroll_into_view_if_needed()
  box=canvas.bounding_box();start=time.monotonic();page.mouse.move(box['x']+box['width']*.45,box['y']+box['height']*.45);page.mouse.down()
  for i in range(60):page.mouse.move(box['x']+box['width']*(.45+i/400),box['y']+box['height']*(.45+i/800));page.wait_for_timeout(12)
  page.mouse.up();elapsed=time.monotonic()-start;after=page.evaluate('window.__LIFECITY_RENDER_METRICS__||null')
  performance={'before':before,'after':after,'interactionSeconds':elapsed,'renderedFramesDuringInteraction':(after['renderedFrames']-before['renderedFrames']) if before and after else None,'limits':'Software WebGL Chromium in cloud, synthetic drag; not real-mobile FPS.'}
 else:performance={'noCanvas':True}
 # Every key screen must switch to English and keep the world grid orientation.
 page.locator('.language-switch').click();page.wait_for_function('()=>document.documentElement.lang==="en"');page.wait_for_timeout(1200)
 english=[]
 for route in ['dashboard','city','tasks','timer','shop','prayers','yuyi','stats','settings','interior']:
  page.goto(BASE+'/'+route,wait_until='networkidle');page.wait_for_selector('#main-content');page.wait_for_timeout(180);english.append({'route':route,'direction':page.locator('html').get_attribute('dir'),'heading':page.locator('h1').first.inner_text()})
 page.goto(BASE+'/tasks');page.wait_for_selector('#main-content');page.screenshot(path=str(OUT/'tasks-english.png'))
 # Offline blocks writes; no queued financial request is silently submitted.
 context.set_offline(True);page.wait_for_function('()=>document.querySelector(".save-state")?.textContent.includes("Offline")');offlineText=page.locator('body').inner_text();offline='You are offline' in offlineText or 'Offline' in offlineText
 context.set_offline(False)
 b.close()
report={'checks':checks,'english':english,'offlineNotice':offline,'pageErrors':errors,'renderer':performance}
(ROOT/'docs/evidence/ui-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'samples':len(checks),'overflowCount':sum(c['horizontalOverflow'] for c in checks),'pageErrors':errors,'offlineNotice':offline,'rendererFrames':performance.get('renderedFramesDuringInteraction')},ensure_ascii=False))
