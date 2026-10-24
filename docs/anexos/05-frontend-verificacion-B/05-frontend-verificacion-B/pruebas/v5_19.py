# V5-19: señal de navegación hacia un segmento lento (2 s) con loading.tsx (Next 16.4.1, producción, Chromium).
# Con el prefetch del enlace terminado, sin prefetch (prefetch={false}), y sin prefetch con useLinkStatus.
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app'; URL='http://localhost:3100'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3100'],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/otra',timeout=1); break
    except Exception: time.sleep(0.3)
SEL={'carga':'[data-testid=lento-cargando]','enlace':'[data-testid=enlace-pendiente]','listo':'[data-testid=lento-listo]'}
def medir(pg, enlace, esperar):
    pg.goto(URL)
    if esperar: time.sleep(1.5)
    t0=time.time(); pg.get_by_role('link',name=enlace,exact=True).click(); vio={}
    while time.time()-t0<5:
        e=pg.evaluate("s => Object.fromEntries(Object.entries(s).map(([k,v]) => [k, !!document.querySelector(v)]))", SEL)
        for k in ('carga','enlace'):
            if e[k] and k not in vio: vio[k]=(time.time()-t0)*1000
        if e['listo']: return vio, (time.time()-t0)*1000
        time.sleep(0.02)
    return vio, None
casos=[('normal','Abrir lento normal',True),('interceptada','Abrir lento',True),
       ('normal','Normal sin prefetch',False),('interceptada','Interceptada sin prefetch',False),
       ('normal','Normal sin prefetch con estado',False),('interceptada','Interceptada sin prefetch con estado',False)]
with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page()
    for tipo, enlace, esperar in casos:
        res=[medir(pg, enlace, esperar) for _ in range(3)]
        def fmt(k): 
            v=[r[0].get(k) for r in res]; return 'nunca' if all(x is None for x in v) else '/'.join('—' if x is None else f'{x:.0f}' for x in v)+' ms'
        print(f"{tipo:12} | {enlace:38} | loading.tsx: {fmt('carga'):16} | useLinkStatus: {fmt('enlace'):16} | contenido: {'/'.join(f'{r[1]:.0f}' for r in res)} ms")
    b.close()
os.killpg(os.getpgid(p.pid),signal.SIGTERM)
