# V5-34: peso del registro del service worker en el JS compartido y del propio service worker.
import subprocess, os, time, signal, urllib.request, gzip
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app3'; PORT=3214; URL=f'http://localhost:{PORT}'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p',str(PORT)],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); r={}
    for ruta in ['/base','/grafico-servidor','/con-provider']:
        ctx=b.new_context(service_workers='block'); pg=ctx.new_page(); js=[]
        pg.on('requestfinished', lambda q: js.append(q) if q.resource_type=='script' else None)
        pg.goto(URL+ruta, wait_until='networkidle'); r[ruta]=sum(q.sizes()['responseBodySize'] for q in js); ctx.close()
    sw=urllib.request.urlopen(URL+'/serwist/sw.js').read()
    print(f"V5-34 · /base con RegistroServiceWorker propio: {r['/base']/1000:.1f} KB (Parte C sin registro: 139,1 KB) · /con-provider (SerwistProvider de @serwist/turbopack): {(r['/con-provider']-r['/grafico-servidor'])/1000:+.1f} KB sobre una página sin componentes de cliente propios · sw.js: {len(sw)/1000:.1f} KB ({len(gzip.compress(sw))/1000:.1f} KB con gzip)")
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
