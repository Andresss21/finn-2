# V5-30c: EnlaceFinn sin conexión (navigator.onLine = false y servidor detenido) no navega: la pantalla se conserva.
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app3'; PORT=3213; URL=f'http://localhost:{PORT}'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
assert subprocess.run(['npx','next','build'],cwd=APP,env=ENV,capture_output=True).returncode==0
p=subprocess.Popen(['npx','next','start','-p',str(PORT)],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chromium'); ctx=b.new_context(); pg=ctx.new_page()
    pg.goto(URL+'/con-datos'); pg.wait_for_function("async()=>{const r=await navigator.serviceWorker.getRegistration('/');return !!(r&&r.active)}", timeout=30000)
    pg.wait_for_timeout(1500); pg.reload(); pg.wait_for_function("()=>document.documentElement.dataset.hidratado==='si'")
    pg.evaluate("()=>{window.__avisos=[];addEventListener('finn:navegacion-sin-conexion',e=>window.__avisos.push(e.detail))}")
    os.killpg(os.getpgid(p.pid),signal.SIGTERM); time.sleep(1); ctx.set_offline(True)
    pg.click('#a-destino'); pg.wait_for_timeout(3000)
    r=pg.evaluate("()=>({url:location.pathname, datos:!!document.querySelector('#datos'), sinConexion:!!document.querySelector('#sin-conexion'), avisos:window.__avisos})")
    print('V5-30c · sin conexión, clic en EnlaceFinn:', r)
    b.close()
