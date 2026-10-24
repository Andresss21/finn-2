# V5-11: ¿Next despacha las Server Actions del cliente de una en una?
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright, expect
APP='/home/claude/v5/app'; URL='http://localhost:3100'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3100'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/otra',timeout=1); break
    except Exception: time.sleep(0.3)
with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page(); pg.goto(URL)
    # referencia: crear sola
    t0=time.time(); pg.get_by_role('button',name='Crear').click(); expect(pg.get_by_test_id('crear-fase')).to_contain_text('listo|1|'); sola=time.time()-t0
    pg.reload()
    pg.get_by_label('Comercio').fill('ab'); time.sleep(0.35)          # sale la lectura lenta (900 ms)
    t0=time.time(); pg.get_by_role('button',name='Crear').click(); expect(pg.get_by_test_id('crear-fase')).to_contain_text('listo|1|',timeout=5000); junta=time.time()-t0
    print(f'V5-11 crear sola: {sola*1000:.0f} ms; crear con una lectura de 900 ms en vuelo: {junta*1000:.0f} ms')
    b.close()
os.killpg(os.getpgid(p.pid),signal.SIGTERM)
