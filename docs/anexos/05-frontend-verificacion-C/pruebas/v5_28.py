# V5-28: foco y anunciador de rutas de Next 16 tras una navegación del cliente.
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app2'; URL='http://localhost:3204'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3204'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page()
    pg.goto(URL+'/inicio-nav'); pg.wait_for_function("()=>{const e=document.querySelector('#ir');return !!e&&Object.keys(e).some(k=>k.startsWith('__reactProps'))}")
    pg.focus('#ir'); pg.keyboard.press('Enter'); pg.wait_for_selector('#destino'); time.sleep(0.5)
    r=pg.evaluate("()=>{const a=document.activeElement; const an=document.querySelector('next-route-announcer'); const t=an&&an.shadowRoot?an.shadowRoot.textContent:null; return [a.tagName+(a.id?'#'+a.id:''), !!an, t, document.title]}")
    print(f"V5-28 · foco después de navegar con Enter: {r[0]} · anunciador presente: {r[1]} · texto anunciado: {r[2]!r} · título: {r[3]!r}")
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
