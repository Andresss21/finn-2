# V5-29 a V5-33: PWA con @serwist/turbopack 9.5.13 sobre Next 16.4.1 (`next build` + `next start`, Chromium de Playwright).
import subprocess, os, time, signal, urllib.request, json, base64
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app3'; PORT=3210; URL=f'http://localhost:{PORT}'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
def compilar(v):
    r=subprocess.run(['npx','next','build'],cwd=APP,env={**ENV,'FINN_VERSION':v,'NEXT_PUBLIC_FINN_VERSION':v},capture_output=True,text=True); assert r.returncode==0, r.stdout[-2000:]
def iniciar():
    p=subprocess.Popen(['npx','next','start','-p',str(PORT)],cwd=APP,env=ENV,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,preexec_fn=os.setsid)
    for _ in range(100):
        try: urllib.request.urlopen(URL+'/base',timeout=1); return p
        except Exception: time.sleep(0.3)
def parar(p): os.killpg(os.getpgid(p.pid),signal.SIGTERM); time.sleep(1)
HID="()=>document.documentElement.dataset.hidratado==='si'"
CACHES="""async()=>{const out=[];for(const n of await caches.keys()){const c=await caches.open(n);for(const r of await c.keys()){const res=await c.match(r);const b=await res.clone().blob();out.push({cache:n,url:new URL(r.url).pathname,bytes:b.size})}}return out}"""
compilar('v1'); p=iniciar()
try:
  with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chromium'); ctx=b.new_context(permissions=['notifications']); pg=ctx.new_page()
    pg.goto(URL+'/con-datos'); pg.wait_for_function(HID)
    pg.wait_for_function("async()=>{const r=await navigator.serviceWorker.getRegistration('/');return !!(r&&r.active)}", timeout=30000)
    alcance=pg.evaluate("async()=>(await navigator.serviceWorker.getRegistration('/')).scope")
    time.sleep(2); pg.reload(); pg.wait_for_function(HID); pg.wait_for_function("()=>!!navigator.serviceWorker.controller", timeout=15000); controla=pg.evaluate("()=>!!navigator.serviceWorker.controller")
    print(f"V5-29a · registrado con alcance {alcance} · controla la página tras recargar: {controla}")
    # navegación del cliente y de documento con red
    pg.click('#a-destino'); pg.wait_for_selector('#destino'); pg.goto(URL+'/con-datos'); pg.wait_for_function(HID)
    c=pg.evaluate(CACHES)
    estaticos=[e for e in c if e['url'].startswith('/_next/static/')]; otros=[e for e in c if not e['url'].startswith('/_next/static/')]
    print(f"V5-29b · precache: {len(c)} entradas, {sum(e['bytes'] for e in c)/1024:.0f} KiB sin comprimir ({len(estaticos)} de /_next/static) · fuera de /_next/static: {[e['url'] for e in otros]}")
    print(f"V5-29c · cachés: {sorted(set(e['cache'] for e in c))} · ¿alguna página o RSC guardada además de /sin-conexion? {any(e['url'] not in ('/sin-conexion',) and not e['url'].startswith('/_next/static/') and not e['url'].startswith('/marca/') for e in otros)}")
    # sin conexión: Playwright no aplica setOffline a los pedidos del service worker, así que además se detiene el servidor
    pg.goto(URL+'/con-datos'); pg.wait_for_function(HID)
    parar(p); ctx.set_offline(True)
    pg.click('#a-destino'); time.sleep(4)
    estado=pg.evaluate("()=>({url:location.pathname, sinConexion:!!document.querySelector('#sin-conexion'), datos:!!document.querySelector('#datos'), destino:!!document.querySelector('#destino')})")
    print(f"V5-30b · sin red ni servidor, clic en un enlace del cliente: {estado}")
    pg.goto(URL+'/con-datos'); doc=pg.locator('#sin-conexion').count()
    print(f"V5-30a · sin red ni servidor, navegación de documento a /con-datos → contenido de /sin-conexion: {doc==1} (la URL sigue siendo {pg.url.replace(URL,'')})")
    ctx.set_offline(False); p=iniciar()
    # instalación
    cdp=ctx.new_cdp_session(pg); pg.goto(URL+'/con-datos'); pg.wait_for_function(HID); time.sleep(1)
    print('V5-31 · errores de instalabilidad (contexto efímero):', cdp.send('Page.getInstallabilityErrors').get('installabilityErrors'))
    pc=pw.chromium.launch_persistent_context('/tmp/claude-0/-home-claude/af86530b-be69-56d5-a0ae-0e2c79c5b29a/scratchpad/perfil-'+str(time.time()), channel='chromium')
    pp=pc.new_page(); pp.goto(URL+'/con-datos'); pp.wait_for_function("async()=>{const r=await navigator.serviceWorker.getRegistration('/');return !!(r&&r.active)}", timeout=30000); pp.reload(); pp.wait_for_timeout(1500)
    print('V5-31 · errores de instalabilidad (perfil persistente):', pc.new_cdp_session(pp).send('Page.getInstallabilityErrors').get('installabilityErrors')); pc.close()
    # push: CDP ServiceWorker.deliverPushMessage no llega al worker sin una suscripción real (el servicio de push no es alcanzable
    # desde el contenedor); se despacha un PushEvent sintético dentro del worker, con la misma carga útil.
    sw=ctx.service_workers[0]
    carga={'notificacionId':'7f1c2b9e-0000-4000-8000-000000000001','titulo':'Compra en SUPER SELECTOS','cuerpo':'Compra en SUPER SELECTOS por $45.00. Revisala en la bandeja.','etiqueta':'sms',
           'destino':{'pantalla':'movimiento','movimientoId':'7f1c2b9e-0000-4000-8000-0000000000aa'},'acciones':['confirmar','rechazar'],'movimientoId':'7f1c2b9e-0000-4000-8000-0000000000aa'}
    sw.evaluate("c=>{try{self.dispatchEvent(new PushEvent('push',{data:JSON.stringify(c)}))}catch(e){}}", carga); pg.wait_for_timeout(1000)
    sw.evaluate("()=>{try{self.dispatchEvent(new PushEvent('push',{data:'no es json'}))}catch(e){}}"); pg.wait_for_timeout(1000)
    n=pg.evaluate("async()=>(await (await navigator.serviceWorker.getRegistration('/')).getNotifications()).map(n=>({t:n.title,b:n.body,tag:n.tag,acc:n.actions?n.actions.map(a=>a.title):null,d:n.data}))")
    print('V5-32a · push con la carga de CP-1 y una carga inválida → notificaciones:', json.dumps(n, ensure_ascii=False))
    # clic en la notificación (sin acción) → navega la ventana abierta al destino con ?notificacion=
    sw.evaluate("async()=>{const n=(await self.registration.getNotifications({tag:'sms'}))[0]; try{self.dispatchEvent(new NotificationEvent('notificationclick',{notification:n}))}catch(e){}}")
    pg.wait_for_url('**/bandeja/**', timeout=10000)
    print('V5-32b · clic en la notificación → la ventana abierta navega a', pg.url.replace(URL,''))
    pg.goto(URL+'/con-datos'); pg.wait_for_function(HID)
    sw.evaluate("c=>{try{self.dispatchEvent(new PushEvent('push',{data:JSON.stringify(c)}))}catch(e){}}", carga); pg.wait_for_timeout(1000)
    sw.evaluate("async()=>{const n=(await self.registration.getNotifications({tag:'sms'}))[0]; try{self.dispatchEvent(new NotificationEvent('notificationclick',{notification:n, action:'confirmar'}))}catch(e){}}")
    pg.wait_for_url('**/bandeja/**', timeout=10000)
    print('V5-32c · acción "Confirmar" con el Route Handler ausente en la app de prueba (404) → abre el movimiento:', pg.url.replace(URL,''))
    # actualización
    v1=set(e['url'] for e in pg.evaluate(CACHES) if e['url'].startswith('/_next/static/chunks/'))
    parar(p); compilar('v2'); p=iniciar()
    pg.evaluate("()=>window.__finnSw.update()")
    pg.wait_for_selector('[data-testid=version-nueva]', timeout=30000)
    v=pg.get_attribute('html','data-version')
    import re
    v2=set(re.findall(r'url:"(/_next/static/chunks/[^"]+)"', urllib.request.urlopen(URL+'/serwist/sw.js').read().decode()))
    solo1=sorted(v1-v2)
    viejo=URL+solo1[0] if solo1 else None
    chunk=pg.evaluate("async(u)=>(await fetch(u)).status", viejo) if viejo else '—'
    try: urllib.request.urlopen(viejo); servidor='200'
    except Exception as ex: servidor=str(getattr(ex,'code',ex))
    print(f"  archivos de /_next/static/chunks solo en la versión 1: {len(solo1)} de {len(v1)}")
    print(f"V5-33a · con la versión 2 publicada, la pestaña abierta (data-version={v}) muestra 'Hay una versión nueva'")
    print(f"V5-33b · un archivo de la versión 1: el servidor nuevo responde {servidor}; desde la pestaña (service worker viejo) responde {chunk}")
    pg.get_by_role('button',name='Recargar').click(); pg.wait_for_function("()=>document.documentElement.dataset.version==='v2'", timeout=20000)
    pg.wait_for_function(HID)
    print(f"V5-33c · tras 'Recargar': data-version={pg.get_attribute('html','data-version')} · aviso visible: {pg.locator('[data-testid=version-nueva]').count()>0}")
    b.close()
finally: parar(p)
