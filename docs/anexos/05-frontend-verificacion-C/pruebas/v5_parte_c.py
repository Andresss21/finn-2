# Verificaciones de la Parte C sobre /home/claude/v5/app2 (Next 16.4.1, `next build` + `next start`, Chromium de Playwright).
# V5-20 JS por ruta · V5-21 D-8 con hidratación · V5-22 caché del enrutador · V5-24 axe-core · V5-25 árbol ARIA.
import subprocess, os, time, signal, urllib.request, json, socket
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app2'; PORT=3200; URL=f'http://localhost:{PORT}'
s=socket.socket(); assert s.connect_ex(('localhost',PORT))!=0, 'puerto ocupado'; s.close()
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p',str(PORT)],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/base',timeout=1); break
    except Exception: time.sleep(0.3)
AXE=open(APP+'/node_modules/axe-core/axe.min.js').read()
HIDRATADO="s => { const e=document.querySelector(s); return !!e && Object.keys(e).some(k=>k.startsWith('__reactProps')); }"
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch()
    print('V5-20 · JS descargado al abrir cada ruta (contexto nuevo; tamaño codificado, gzip de next start)')
    base=None
    for ruta in ['/base','/formulario','/formulario-es','/formulario-llaves','/formulario-z','/grafico-servidor','/grafico-cliente']:
        ctx=b.new_context(); pg=ctx.new_page(); js=[]
        pg.on('requestfinished', lambda r: js.append(r) if r.resource_type=='script' else None)
        pg.goto(URL+ruta, wait_until='networkidle')
        cod=sum(r.sizes()['responseBodySize'] for r in js); 
        if base is None: base=cod
        print(f'  {ruta:18} {len(js):2} archivos  {cod/1024:6.1f} KiB  (sobre /base: {(cod-base)/1024:+5.1f} KiB)')
        ctx.close()
    print('V5-21 · D-8: señal de EnlaceFinn sin prefetch, esperando la hidratación (10 iteraciones)')
    pg=b.new_page(); res=[]
    for i in range(10):
        pg.goto(URL+'/inicio-nav'); pg.wait_for_function(HIDRATADO, arg='#ir')
        t0=time.time(); pg.click('#ir'); senal=None
        while time.time()-t0<6:
            e=pg.evaluate("()=>[!!document.querySelector('#ir [data-pendiente=si]'), !!document.querySelector('#destino')]")
            if e[0] and senal is None: senal=(time.time()-t0)*1000
            if e[1]: break
            time.sleep(0.01)
        res.append((senal,(time.time()-t0)*1000))
    print('  señal: '+' / '.join('—' if s is None else f'{s:.0f}' for s,_ in res)+' ms')
    print(f'  con señal: {sum(s is not None for s,_ in res)}/10 · contenido en {min(c for _,c in res):.0f} a {max(c for _,c in res):.0f} ms')
    print('V5-22 · caché del enrutador (staleTimes por defecto)')
    pg.goto(URL+'/inicio-nav'); pg.wait_for_function(HIDRATADO, arg='#ir'); r0=pg.get_attribute('h1','data-render')
    pg.click('#ir'); pg.wait_for_selector('#destino'); d1=pg.get_attribute('#destino','data-render')
    pg.go_back(); pg.wait_for_selector('#ir'); r1=pg.get_attribute('h1','data-render')
    pg.go_forward(); pg.wait_for_selector('#destino'); d2=pg.get_attribute('#destino','data-render')
    pg.click('#volver'); pg.wait_for_selector('#ir'); time.sleep(0.2); r2=pg.get_attribute('h1','data-render')
    pg.click('#ir'); pg.wait_for_selector('#destino'); time.sleep(0.2); d3=pg.get_attribute('#destino','data-render')
    print(f'  atrás → origen restaurado de la caché: {r1==r0} · adelante → destino restaurado: {d2==d1}')
    print(f'  enlace al origen otra vez → render nuevo: {r2!=r0} · enlace al destino otra vez → render nuevo: {d3!=d1}')
    print('V5-24 · axe-core 4.x (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice)')
    for tema in ['claro','oscuro']:
        pg.goto(URL+'/tokens'+('?tema=oscuro' if tema=='oscuro' else '')); pg.add_script_tag(content=AXE)
        r=pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});return {v:r.violations.map(v=>v.id+':'+v.nodes.length), p:r.passes.length, inc:r.incomplete.map(v=>v.id)}}")
        print(f'  {tema:6}: violaciones {r["v"] or "ninguna"} · reglas que pasan {r["p"]} · a revisar a mano {r["inc"]}')
    for ruta in ['/base','/formulario','/grafico-servidor']:
        pg.goto(URL+ruta); pg.add_script_tag(content=AXE)
        r=pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>v.id+':'+v.nodes.length)}")
        print(f'  {ruta:18}: violaciones {r or "ninguna"}')
    print('V5-25 · árbol de accesibilidad (aria_snapshot de Playwright)')
    pg.goto(URL+'/base'); print('  /base main:\n'+'\n'.join('    '+l for l in pg.locator('main').aria_snapshot().splitlines()))
    pg.goto(URL+'/grafico-servidor'); print('  /grafico-servidor figure:\n'+'\n'.join('    '+l for l in pg.locator('figure').aria_snapshot().splitlines()))
    print('  getByText("menos $1,234.50") encuentra el monto:', pg.goto(URL+'/base') and pg.get_by_text('menos $1,234.50').count())
    b.close()
finally:
    os.killpg(os.getpgid(p.pid),signal.SIGTERM)
