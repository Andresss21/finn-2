"""V5-36 (actualizado por CT-08, Fase 7: rutas con marcas [Fn] en la celda, OP-53 de CF-01): genera las tablas de trazabilidad de 05 §15 a partir de §2 (mapa) y 4.14 (acciones de un toque).
Uso: python3 trazabilidad.py 05-frontend.md > tablas.md   |   python3 trazabilidad.py 05-frontend.md --comprobar
--comprobar: falla si las tablas de §15 del documento no coinciden con las generadas, o si falta una consulta u operación."""
import re, sys
texto = open(sys.argv[1], encoding='utf-8').read()
def seccion(d, h): i = texto.index(d); return texto[i:texto.index(h, i)]
mapa = seccion('## 2. Mapa de pantallas', '## 3. Navegación')
filas = []
for l in mapa.splitlines():
    if not l.startswith('| `/'): continue
    c = [x.strip() for x in l.replace('\\|', '¦').strip('|').split(' | ')]
    filas.append(dict(ruta=re.match(r'`([^`]+)`', c[0]).group(1), clase=c[1], consulta=c[2], ops=c[3]))  # CT-08: la ruta es el primer `…`
CONSULTAS = ['inicio', 'presupuesto', 'detalleCategoria', 'detalleLpa', 'cuentas', 'detalleCuenta', 'actividad', 'detalleTransaccion',
             'bandeja', 'reporte', 'metas', 'ajustes', 'programadas', 'reglas', 'porCobrar', 'estructura', 'notificaciones', 'formulario']
def ids(t):
    s = set(re.findall(r'OPT?-\d{2}', t))
    for a, b in re.findall(r'OP-(\d{2}) a OP-(\d{2})', t): s |= {f'OP-{n:02d}' for n in range(int(a), int(b) + 1)}
    return s
def flujo(ruta):
    # Carpeta de flujos/ (FE-59): segmentos sin los ids; si la ruta termina en un id, se agrega su nombre sin "Id".
    partes = [x for x in ruta.strip('/').split('/') if x]
    seg = [x for x in partes if not re.fullmatch(r'\[[a-zA-Z]+Id\]', x)]
    if partes and re.fullmatch(r'\[[a-zA-Z]+Id\]', partes[-1]): seg.append(partes[-1][1:-3])
    seg = [re.sub(r'([a-z])([A-Z])', r'\1-\2', x.strip('[]')).lower() for x in seg]
    return '-'.join(seg) or 'inicio'
CLASE = {'[L]': 'flujo largo', '[C]': 'flujo corto'}
def orden(op): return (op.startswith('OPT'), int(op.split('-')[1]))
# 15.1 consultas
pc = re.compile(r'`(' + '|'.join(CONSULTAS) + r')\(')
por_consulta = {c: [] for c in CONSULTAS}
for f in filas:
    for c in set(pc.findall(f['consulta'])): por_consulta[c].append(f['ruta'])
out = ['| Consulta (04 §6) | Rutas | Cantidad |', '|---|---|---|']
for c in CONSULTAS: out.append(f"| `{c}` | {', '.join('`'+r+'`' for r in sorted(por_consulta[c]))} | {len(por_consulta[c])} |")
t1 = '\n'.join(out)
# 15.2 operaciones
por_op = {}
for f in filas:
    for op in ids(f['ops']):
        comp = f"`flujos/{flujo(f['ruta'])}/`" if f['clase'] in CLASE else f"página `{f['ruta']}`"
        if '[1T]' in f['ops'] and f['clase'] not in CLASE: comp += ' [1T]'
        por_op.setdefault(op, []).append((f['ruta'], f['clase'], comp))
ut = seccion('### 4.14 Acciones de un toque', '**Reglas de la salida para revertir')
for l in ut.splitlines():
    if not l.startswith('| ') or l.startswith('| Acción') or l.startswith('|---'): continue
    c = [x.strip() for x in l.strip('|').split(' | ')]
    for op in ids(c[1]):
        donde = c[2]
        if not any(r[0] == 'acción de un toque' and r[2] == donde for r in por_op.get(op, [])):
            por_op.setdefault(op, []).append(('acción de un toque', '[1T]', donde))
out = ['| Operación | Ruta o lugar | Clase | Componente |', '|---|---|---|---|']
for op in sorted(por_op, key=orden):
    for r, cl, comp in sorted(set(por_op[op])):
        out.append(f"| {op} | {'`'+r+'`' if r.startswith('/') else r} | {cl} | {comp} |")
t2 = '\n'.join(out)
todas = {f'OP-{n:02d}' for n in range(1, 54)} | {f'OPT-{n:02d}' for n in range(1, 10)}  # CT-08: OP-53 (CF-01, Fase 6)
faltan = sorted(todas - set(por_op) - {'OP-35'}, key=orden)
flujos = {}
for f in filas:
    if f['clase'] in CLASE: flujos.setdefault(flujo(f['ruta']), []).append(f['ruta'])
choques = {k: v for k, v in flujos.items() if len(v) > 1}
resumen = f"Consultas: {sum(1 for c in CONSULTAS if por_consulta[c])}/{len(CONSULTAS)} · operaciones con pantalla: {len(set(por_op) & todas)}/{len(todas)} (sin pantalla: OP-35, el webhook) · flujos: {len(flujos)} · carpetas de flujo repetidas: {len(choques)}"
if '--comprobar' in sys.argv:
    doc = seccion('## 15. Trazabilidad', '## 16.')
    err = []
    if t1 not in doc: err.append('la tabla 15.1 no coincide con la generada')
    if t2 not in doc: err.append('la tabla 15.2 no coincide con la generada')
    if faltan: err.append('operaciones sin pantalla: ' + ', '.join(faltan))
    if any(not v for v in por_consulta.values()): err.append('consultas sin ruta')
    if choques: err.append(f'carpetas de flujo repetidas: {choques}')
    print(resumen); print('\n'.join(err) if err else 'V5-36: §15 coincide con §2 y 4.14')
    sys.exit(1 if err else 0)
print('<!-- 15.1 -->'); print(t1); print('<!-- 15.2 -->'); print(t2); print('<!-- resumen -->'); print(resumen)
if faltan: print('FALTAN:', faltan)
if choques: print('CHOQUES:', choques)
