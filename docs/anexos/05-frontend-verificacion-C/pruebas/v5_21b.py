# V5-21b: clic en EnlaceFinn ANTES de la hidratación: ¿navegación del cliente o de documento?
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app2'; URL='http://localhost:3205'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3205'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); ctx=b.new_context(); pg=ctx.new_page(); res=[]
    for i in range(5):
        # Se demoran los scripts para que el clic llegue antes de hidratar.
        pg.route('**/_next/static/**/*.js', lambda r: (time.sleep(1.0), r.continue_()))
        pg.goto(URL+'/inicio-nav', wait_until='domcontentloaded')
        hid=pg.evaluate("()=>{const e=document.querySelector('#ir');return Object.keys(e).some(k=>k.startsWith('__reactProps'))}")
        pg.evaluate("window.__marca=1"); pg.click('#ir'); pg.wait_for_selector('#destino', timeout=15000)
        res.append((hid, pg.evaluate("()=>window.__marca===1"))); pg.unroute('**/_next/static/**/*.js')
    print('V5-21b · hidratado al hacer clic / la ventana sobrevivió (navegación del cliente):', res)
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
