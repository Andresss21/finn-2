# V5-27: INP de laboratorio con Playwright (CPU ×4 por CDP) en /formulario, y movimiento reducido (prefers-reduced-motion).
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app2'; URL='http://localhost:3203'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3203'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
OBS="""window.__ev=[];new PerformanceObserver(l=>{for(const e of l.getEntries()) if(e.interactionId) window.__ev.push({n:e.name,d:e.duration})}).observe({type:'event',durationThreshold:16,buffered:true});"""
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); res=[]
    for i in range(5):
        ctx=b.new_context(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); pg=ctx.new_page()
        cdp=ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
        pg.goto(URL+'/formulario'); pg.wait_for_function("()=>{const e=document.querySelector('#monto');return !!e&&Object.keys(e).some(k=>k.startsWith('__reactProps'))}")
        pg.evaluate(OBS); pg.click('#monto'); pg.keyboard.type('12a'); pg.click('button[type=submit]')   # error de validación
        pg.fill('#monto',''); pg.keyboard.type('1234.50'); pg.click('button[type=submit]'); pg.wait_for_selector('output[data-enviado="1234.50"]')
        time.sleep(0.3); ev=pg.evaluate('window.__ev'); res.append(max([e['d'] for e in ev] or [0])); ctx.close()
    print(f"V5-27a · interacción más lenta por corrida (CPU ×4): {' / '.join(f'{r:.0f}' for r in res)} ms · máximo {max(res):.0f} ms (presupuesto INP 200 ms)")
    ctx=b.new_context(reduced_motion='reduce'); pg=ctx.new_page(); pg.goto(URL+'/tokens')
    d=pg.evaluate("()=>{const e=document.createElement('div');e.style.transition='color 300ms';e.style.animation='x 2s';document.body.append(e);const c=getComputedStyle(e);return [c.transitionDuration,c.animationDuration]}")
    ctx2=b.new_context(); pg2=ctx2.new_page(); pg2.goto(URL+'/tokens')
    d2=pg2.evaluate("()=>{const e=document.createElement('div');e.style.transition='color 300ms';document.body.append(e);return getComputedStyle(e).transitionDuration}")
    print(f"V5-27b · con movimiento reducido: transición {d[0]}, animación {d[1]} · sin preferencia: transición {d2}")
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
