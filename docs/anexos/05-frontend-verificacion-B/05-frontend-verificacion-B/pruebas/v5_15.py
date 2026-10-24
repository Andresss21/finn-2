# V5-15 a V5-17: error.tsx con idError, sesión vencida en una consulta y NO_ENCONTRADO (Next 16.4.1, producción).
import subprocess, os, time, signal, urllib.request
from playwright.sync_api import sync_playwright
APP='/home/claude/v5/app'; URL='http://localhost:3100'
ENV={**os.environ,'PATH':'/home/claude/v5/n24/node_modules/.bin:'+os.environ['PATH'],'NEXT_TELEMETRY_DISABLED':'1'}
p=subprocess.Popen(['npx','next','start','-p','3100'],cwd=APP,env=ENV,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,preexec_fn=os.setsid,text=True)
for _ in range(100):
    try: urllib.request.urlopen(URL+'/otra',timeout=1); break
    except Exception: time.sleep(0.3)
res=[]
def ok(n,c,d=''): res.append(c); print(('PASA ' if c else 'FALLA ')+n+(' — '+d if d else ''))
with sync_playwright() as pw:
    b=pw.chromium.launch(); pg=b.new_page()
    pg.goto(URL+'/fallo'); ref=pg.get_by_test_id('ref').inner_text(); msg=pg.get_by_test_id('msg').inner_text()
    ok('V5-15a error.tsx recibe el idError como digest en producción', ref=='E-7K2QPX', f'digest={ref!r}')
    ok('V5-15b el mensaje original no llega al navegador', 'FN003' not in msg and 'Algo salió' not in msg, f'message={msg[:90]!r}')
    pg.goto(URL); pg.goto(URL+'/fallo-normal'); ref2=pg.get_by_test_id('ref').inner_text(); msg2=pg.get_by_test_id('msg').inner_text()
    ok('V5-15c un error no previsto llega con un digest numérico de Next y sin el texto', ref2.isdigit() and 'detalle interno' not in msg2, f'digest={ref2!r}')
    pg.goto(URL+'/protegida?periodo=2026-09-21')
    ok('V5-16a sesión vencida en una consulta → /ingresar con volver = ruta y búsqueda', pg.get_by_test_id('ingresar').inner_text()=='volver=/protegida?periodo=2026-09-21', pg.url)
    pg.goto(URL+'/ingresar?volver=//evil.example/x')
    ok('V5-16b volver externo se reemplaza por /', pg.get_by_test_id('ingresar').inner_text()=='volver=/')
    pg.goto(URL+'/ingresar?volver=/%5Cevil.example')
    ok('V5-16c volver con barra invertida se reemplaza por /', pg.get_by_test_id('ingresar').inner_text()=='volver=/')
    r=pg.goto(URL+'/cosas/no-existe')
    ok('V5-17 NO_ENCONTRADO → notFound(): not-found.tsx con estado 404', pg.get_by_test_id('no-encontrado').count()==1 and r.status==404, f'status={r.status}')
    b.close()
os.killpg(os.getpgid(p.pid),signal.SIGTERM); out=p.stdout.read() if p.stdout else ''
print('registro del servidor contiene el digest E-7K2QPX:', 'E-7K2QPX' in out)
print(f'{sum(res)}/{len(res)} pasan')
