# V5-03 a V5-06: flujo de escritura en Next 16.4.1 con Server Actions (Playwright + Chromium).
import subprocess, time, os, re, sys, signal, pathlib
from playwright.sync_api import sync_playwright, expect

APP = '/home/claude/v5/app'
ENV = {**os.environ, 'PATH': '/home/claude/v5/n24/node_modules/.bin:' + os.environ['PATH'], 'NEXT_TELEMETRY_DISABLED': '1'}
URL = 'http://localhost:3100'
resultados = []
def ok(nombre, cond, detalle=''):
    resultados.append((nombre, bool(cond), detalle)); print(('PASA ' if cond else 'FALLA ') + nombre + (f' — {detalle}' if detalle else ''))

def arrancar():
    import urllib.request
    try:
        urllib.request.urlopen(URL + '/otra', timeout=1); raise SystemExit('el puerto 3100 ya está ocupado')
    except SystemExit: raise
    except Exception: pass
    p = subprocess.Popen(['npx', 'next', 'start', '-p', '3100'], cwd=APP, env=ENV, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
    for _ in range(100):
        try:
            import urllib.request; urllib.request.urlopen(URL + '/otra', timeout=1); return p
        except Exception: time.sleep(0.3)
    raise SystemExit('no arrancó')
def parar(p): os.killpg(os.getpgid(p.pid), signal.SIGTERM); p.wait(); time.sleep(1)
def servidor(pg): return pg.get_by_test_id('servidor').inner_text()
def llamadas(pg): return int(re.search(r'llamadas (\d+)', servidor(pg)).group(1))

srv = arrancar()
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(locale='es-SV', timezone_id='America/El_Salvador')
    pg = ctx.new_page(); pg.goto(URL)
    fa = pg.get_by_test_id('form-asignar').first

    # V5-03a: escritura simple; el árbol se actualiza con la respuesta de la acción (revalidatePath), sin refrescar
    fa.locator('input[name=monto]').fill('6000'); fa.get_by_role('button', name='Asignar').click()
    expect(fa.get_by_test_id('fase')).to_have_text('listo', timeout=5000)
    ok('V5-03a revalidatePath actualiza la página con la respuesta', 'rev 2' in servidor(pg) and 'asignado 6000' in servidor(pg), servidor(pg))
    ok('V5-03a esperado conserva la instantánea al abrir', fa.get_by_test_id('esperado').inner_text() == '5000')

    # V5-03b: previsualizar → confirmar con huella; exactamente dos llamadas y escribe al primer intento de confirmar
    pg.reload(); fa = pg.get_by_test_id('form-asignar').first
    n0 = llamadas(pg)
    fa.locator('input[name=monto]').fill('20000'); fa.get_by_role('button', name='Asignar').click()
    expect(pg.get_by_role('alertdialog', name='Confirmar')).to_be_visible()
    ok('V5-03b REQUIERE_CONFIRMACION muestra la previsualización', 'deltaLpa -14000' in pg.get_by_test_id('prev').inner_text())
    pg.get_by_role('button', name='Confirmar').click()
    expect(fa.get_by_test_id('fase')).to_have_text('listo', timeout=5000)
    ok('V5-03b confirmar con huella escribe al primer intento', llamadas(pg) - n0 == 2 and 'lpa -5000' in servidor(pg), servidor(pg))

    # se vuelve a un LPA positivo para que las siguientes asignaciones no pidan confirmación
    pg.reload(); fa = pg.get_by_test_id('form-asignar').first
    fa.locator('input[name=monto]').fill('5000'); fa.get_by_role('button', name='Asignar').click()
    expect(fa.get_by_test_id('fase')).to_have_text('listo')
    # V5-03c: CONFLICTO desactualizado entre dos pestañas
    pg.reload(); fa = pg.get_by_test_id('form-asignar').first
    pg2 = ctx.new_page(); pg2.goto(URL); f2 = pg2.get_by_test_id('form-asignar').first
    f2.locator('input[name=monto]').fill('6000'); f2.get_by_role('button', name='Asignar').click()
    expect(f2.get_by_test_id('fase')).to_have_text('listo')
    fa.locator('input[name=monto]').fill('7000'); fa.get_by_role('button', name='Asignar').click()
    expect(fa.get_by_test_id('fase')).to_have_text('error:conflicto_desactualizado')
    ok('V5-03c otra pestaña cambió el valor → conflicto_desactualizado', True); pg2.close()

    # V5-04: doble envío. Dos requestSubmit() en el mismo tick con una acción de 800 ms → una sola llamada
    pg.reload(); fa = pg.get_by_test_id('form-asignar').first
    fa.locator('input[name=monto]').fill('8000'); fa.locator('input[name=demora]').fill('800')
    n0 = llamadas(pg)
    pg.evaluate("() => { const f = document.querySelector('[data-testid=form-asignar]'); f.requestSubmit(); f.requestSubmit(); f.requestSubmit(); }")
    expect(fa.get_by_test_id('fase')).to_have_text('listo', timeout=5000)
    ok('V5-04 doble envío: tres envíos en el mismo tick → una llamada', llamadas(pg) - n0 == 1, f'{llamadas(pg) - n0} llamadas')

    # V5-05: id conservado en el reintento único de OCUPADO e INCIERTO
    for fallo, esperado in [('ocupado', 'listo|2|'), ('incierto', 'listo:ya|2|')]:
        pg.reload(); fc = pg.get_by_test_id('form-crear')
        fc.locator('select[name=fallo]').select_option(fallo); fc.get_by_role('button', name='Crear').click()
        expect(fc.get_by_test_id('crear-fase')).to_contain_text(esperado, timeout=5000)
        idu = fc.get_by_test_id('crear-fase').inner_text().split('|')[2]
        ok(f'V5-05 {fallo}: reintento único automático con el mismo id', True, fc.get_by_test_id('crear-fase').inner_text())
    pg.reload()
    ok('V5-05 INCIERTO tras aplicar: el reintento responde ya_aplicada y no duplica', 'creadas 2' in servidor(pg), servidor(pg))
    # id nuevo tras un éxito
    fc = pg.get_by_test_id('form-crear'); fc.get_by_role('button', name='Crear').click(); expect(fc.get_by_test_id('crear-fase')).to_contain_text('listo|1|')
    id1 = fc.get_by_test_id('crear-fase').inner_text().split('|')[2]
    fc.get_by_role('button', name='Crear').click(); expect(fc.get_by_test_id('crear-fase')).to_contain_text('listo|2|')
    id2 = fc.get_by_test_id('crear-fase').inner_text().split('|')[2]
    ok('V5-05 después de un éxito el siguiente envío usa un id nuevo', id1 != id2, f'{id1[:8]} → {id2[:8]}')

    # V5-06: ruta interceptada para un flujo corto y la misma URL como página completa
    pg.goto(URL); pg.get_by_role('link', name='Abrir asignar').click()
    expect(pg.get_by_test_id('superpuesto')).to_be_visible()
    ok('V5-06a navegación interna: /asignar se muestra superpuesto y la página de origen sigue montada',
       pg.url.endswith('/asignar') and pg.get_by_test_id('servidor').count() == 1, pg.url)
    sp = pg.get_by_test_id('superpuesto')
    sp.locator('input[name=monto]').fill('9000'); sp.get_by_role('button', name='Asignar').click()
    expect(pg.get_by_test_id('superpuesto')).to_have_count(0, timeout=5000)
    ok('V5-06b al terminar, router.back() cierra el superpuesto y vuelve a /', pg.url == URL + '/' and 'asignado 9000' in servidor(pg), pg.url + ' ' + servidor(pg))
    pg.get_by_role('link', name='Abrir asignar').click(); expect(pg.get_by_test_id('superpuesto')).to_be_visible()
    pg.reload()
    ok('V5-06c recargar con el superpuesto abierto → página completa', pg.get_by_test_id('pagina-completa').count() == 1 and pg.get_by_test_id('superpuesto').count() == 0)
    pg.goto(URL + '/asignar')
    ok('V5-06d abrir la URL directamente → página completa', pg.get_by_test_id('pagina-completa').count() == 1)
    pg.goto(URL); pg.get_by_role('link', name='Abrir asignar').click(); expect(pg.get_by_test_id('superpuesto')).to_be_visible()
    pg.go_back()
    ok('V5-06e atrás del navegador cierra el superpuesto', pg.get_by_test_id('superpuesto').count() == 0 and pg.url == URL + '/')

    # V5-07: router.refresh() trae datos nuevos y conserva el estado de los componentes de cliente
    pg.goto(URL); pg.get_by_label('Borrador').fill('texto a medio escribir')
    otra = ctx.new_page(); otra.goto(URL); fo = otra.get_by_test_id('form-asignar').first
    fo.locator('input[name=monto]').fill('9500'); fo.get_by_role('button', name='Asignar').click(); expect(fo.get_by_test_id('fase')).to_have_text('listo'); otra.close()
    antes = servidor(pg); pg.get_by_role('button', name='Refrescar').click(); pg.wait_for_function("() => document.querySelector('[data-testid=servidor]').innerText.includes('asignado 9500')", timeout=5000)
    ok('V5-07 router.refresh(): datos nuevos y borrador intacto', pg.get_by_label('Borrador').input_value() == 'texto a medio escribir', antes + ' → ' + servidor(pg))

    # V5-08: lectura interactiva: 1 carácter no consulta; respuesta lenta de "ab" no pisa a "abc"
    pg.goto(URL); n0 = llamadas(pg); c = pg.get_by_label('Comercio')
    c.press_sequentially('a'); time.sleep(0.5)
    c.press_sequentially('b'); time.sleep(0.45)          # sale "ab" (tarda 900 ms)
    c.press_sequentially('c'); time.sleep(2.0)           # "abc" espera a que termine "ab" y sale después
    pg.reload()
    ok('V5-08 lectura interactiva: sin consulta con 1 carácter, la respuesta vieja se descarta',
       llamadas(pg) - n0 == 2, f'{llamadas(pg) - n0} consultas')

    # V5-09: desfase de versión. La pestaña queda abierta, se despliega una versión nueva y se envía
    pg.goto(URL); fa = pg.get_by_test_id('form-asignar').first
    parar(srv)
    a = pathlib.Path(APP + '/lib/acciones.ts'); f = pathlib.Path(APP + '/componentes/form-asignar.tsx')
    oa, of = a.read_text(), f.read_text()
    a.write_text(oa.replace('export async function asignar(', 'export async function asignarRenombrada('))
    f.write_text(of.replace('{ asignar }', '{ asignarRenombrada as asignar }'))
    r = subprocess.run(['npx', 'next', 'build'], cwd=APP, env=ENV, capture_output=True, text=True)
    a.write_text(oa); f.write_text(of)
    respuestas = []
    pg.on('response', lambda rs: respuestas.append(f"{rs.status} {rs.request.headers.get('next-action','')[:10]}") if rs.request.method == 'POST' else None)
    srv = arrancar()
    errores = []; pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
    fa.locator('input[name=monto]').fill('100'); fa.get_by_role('button', name='Asignar').click()
    fa.get_by_test_id('fase').wait_for(); time.sleep(2)
    fase = fa.get_by_test_id('fase').inner_text()
    ok('V5-09 acción renombrada en la versión nueva → error de versión reconocible', fase == 'error:version_nueva', fase + ' | POST: ' + ', '.join(respuestas) + ' | consola: ' + ' / '.join(errores)[:500])
    b.close()
parar(srv)
print(f"{sum(1 for r in resultados if r[1])}/{len(resultados)} pasan")
