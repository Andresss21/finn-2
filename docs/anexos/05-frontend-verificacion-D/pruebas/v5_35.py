# V5-35 [R3]: método de 13.4 para separar compartido, biblioteca de formularios y JS propio de cada ruta.
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app3'; PORT=3215; URL=f'http://localhost:{PORT}'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p',str(PORT)],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
CON=['/formulario','/formulario-es','/formulario-llaves']; SIN=['/base','/grafico-servidor','/sin-conexion','/con-datos']
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(); arch={}; tam={}
    for r in CON+SIN:
        ctx=b.new_context(service_workers='block'); pg=ctx.new_page(); js=[]
        pg.on('requestfinished', lambda q: js.append(q) if q.resource_type=='script' else None)
        pg.goto(URL+r, wait_until='networkidle')
        arch[r]=set(); 
        for q in js: arch[r].add(q.url); tam[q.url]=q.sizes()['responseBodySize']
        ctx.close()
    todas=set.intersection(*arch.values())
    formularios=set.intersection(*(arch[r] for r in CON)) - set.union(*(arch[r] for r in SIN))
    kb=lambda s: sum(tam[u] for u in s)/1000
    print(f"V5-35 · compartido: {kb(todas):.1f} KB ({len(todas)} archivos) · biblioteca de formularios: {kb(formularios):.1f} KB ({len(formularios)} archivos; presupuesto 50 KB)")
    for r in CON+SIN:
        propio=arch[r]-todas-(formularios if r in CON else set())
        print(f"  {r:20} propio: {kb(propio):5.1f} KB")
    b.close()
finally: os.killpg(os.getpgid(p.pid),signal.SIGTERM)
