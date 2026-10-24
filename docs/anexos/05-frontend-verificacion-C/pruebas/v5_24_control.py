# Control negativo de V5-24: axe debe reportar color-contrast, button-name y label en claro y en oscuro.
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app2'; URL='http://localhost:3202'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3202'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
AXE=open(APP+'/node_modules/axe-core/axe.min.js').read()
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page()
    for t in ['','?tema=oscuro']:
        pg.goto(URL+'/control-axe'+t); pg.add_script_tag(content=AXE)
        v=pg.evaluate("async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>v.id).sort()")
        esperado=['button-name','color-contrast','label']
        print(f"  {'oscuro' if t else 'claro':6}: {v} → {'detecta los 3' if all(e in v for e in esperado) else 'FALTA ALGUNO'}")
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
