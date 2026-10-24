"""V5-18: cobertura del mapa de pantallas de 05-frontend.md (§2) contra el árbol de 1.3 y el catálogo de 04 §6.
Uso: python3 cobertura.py 05-frontend.md   → código 0 si todo pasa."""
import re, sys
texto = open(sys.argv[1], encoding='utf-8').read()
errores, avisos = [], []
def falla(regla, msg): errores.append(f'{regla}: {msg}')

def seccion(desde, hasta):
    i = texto.index(desde); j = texto.index(hasta, i)
    return texto[i:j]

# --- Árbol de 1.3 -------------------------------------------------------------
arbol_txt = seccion('### 1.3 Árbol de rutas', '\nReglas:')
bloque = arbol_txt.split('```')[1]
arbol = []
for linea in bloque.splitlines():
    if not linea.strip() or linea.strip() == '(finn)/': continue
    previo = re.split(r'\s\[(?:P|S|D|L|C)\]', linea)[0]
    for tok in previo.split():
        if tok.endswith('/') or tok.endswith('page.tsx'):
            r = '/' + tok.replace('page.tsx', '').strip('/')
            arbol.append(r if r != '/' else '/')
arbol = [('/' if a in ('/', '//') else a) for a in arbol]

# --- Mapa de §2 ---------------------------------------------------------------
mapa_txt = seccion('## 2. Mapa de pantallas', '## 3. Navegación')
filas = {}
for linea in mapa_txt.splitlines():
    if not linea.startswith('| `/'): continue
    celdas = [c.strip() for c in linea.replace('\\|', '¦').strip('|').split(' | ')]
    if len(celdas) != 6: falla('FORMATO', f'{celdas[0]} tiene {len(celdas)} columnas'); continue
    ruta = celdas[0].strip('`')
    if ruta in filas: falla('T1', f'{ruta} aparece más de una vez en §2')
    filas[ruta] = dict(zip(['ruta', 'clase', 'consulta', 'operaciones', 'avisos', 'notas'], [ruta] + celdas[1:]))

# T1: el árbol y el mapa tienen las mismas rutas (más las de acceso y la estática de 1.2)
extra = {'/ingresar', '/ingresar/verificar', '/ingresar/inscribir', '/sin-conexion'}
for r in set(arbol) - set(filas): falla('T1', f'{r} está en el árbol de 1.3 y no en §2')
for r in set(filas) - set(arbol) - extra: falla('T1', f'{r} está en §2 y no en el árbol de 1.3')
dup = {a for a in arbol if arbol.count(a) > 1}
for d in dup: falla('T1', f'{d} aparece más de una vez en el árbol de 1.3')

# T2: toda consulta del catálogo de 04 §6 tiene al menos una ruta
consultas = ['inicio', 'presupuesto', 'detalleCategoria', 'detalleLpa', 'cuentas', 'detalleCuenta', 'actividad',
             'detalleTransaccion', 'bandeja', 'reporte', 'metas', 'ajustes', 'programadas', 'reglas', 'porCobrar',
             'estructura', 'notificaciones', 'formulario']
patron_consulta = re.compile(r'`(' + '|'.join(consultas) + r')\(')
usadas = {}
for f in filas.values():
    for c in patron_consulta.findall(f['consulta']): usadas.setdefault(c, []).append(f['ruta'])
for c in consultas:
    if c not in usadas: falla('T2', f'la consulta {c} no tiene ninguna ruta')
if not any('sugerencia' in f['operaciones'] for f in filas.values()): falla('T2', 'la lectura interactiva sugerencia no aparece')
if not any('búsqueda' in (f['operaciones'] + f['notas']) for f in filas.values()): falla('T2', 'la búsqueda de compras (CP-3) no aparece')

# T3: toda variante de formulario (04 6.14.1 + CP-10c) tiene al menos una ruta
variantes = ['registrar', 'pagar_tarjeta', 'cuota_prestamo', 'editar_transaccion', 'cobrar', 'condonar', 'devolver',
             'asignar', 'archivar_categoria', 'fusionar', 'cuenta', 'programada', 'movimiento', 'formato', 'meta', 'regla',
             'conciliar']
vistas = set(re.findall(r"operacion: '([a-z_]+)'", ' '.join(f['consulta'] for f in filas.values())))
for v in variantes:
    if v not in vistas: falla('T3', f"formulario({{ operacion: '{v}' }}) no tiene ninguna ruta")
for v in vistas - set(variantes): falla('T3', f"variante desconocida '{v}'")

# T4: toda ruta tiene consulta, salvo las de acceso, estáticas y redirecciones
for f in filas.values():
    if f['clase'] in ('Acceso', 'Estática', 'Redirección'): continue
    if not patron_consulta.search(f['consulta']): falla('T4', f"{f['ruta']} no tiene consulta")

# T5: toda operación de 04 (OP-01..52, OPT-01..09) aparece en §2 o en las acciones de un toque (4.14)
def ids(t):
    s = set()
    for a, b in re.findall(r'OP-(\d{2}) a OP-(\d{2})', t): s |= {f'OP-{n:02d}' for n in range(int(a), int(b) + 1)}
    s |= set(re.findall(r'OPT-\d{2}', t)); s |= set(re.findall(r'OP-\d{2}', t))
    return s
un_toque = seccion('### 4.14 Acciones de un toque', '**Reglas de la salida para revertir')
presentes = ids(' '.join(f['operaciones'] for f in filas.values())) | ids(un_toque)
sin_pantalla = {'OP-35'}                    # webhook; OP-43 automático y OPT-09 también tienen pantalla o mención
todas = {f'OP-{n:02d}' for n in range(1, 53)} | {f'OPT-{n:02d}' for n in range(1, 10)}
for op in sorted(todas - presentes - sin_pantalla): falla('T5', f'{op} no tiene pantalla ni acción de un toque')

# T6: todo aviso AV-01..24 aparece en la columna de avisos de §2
avisos_mapa = set(re.findall(r'AV-\d{2}', ' '.join(f['avisos'] for f in filas.values())))
for n in range(1, 25):
    if f'AV-{n:02d}' not in avisos_mapa: falla('T6', f'AV-{n:02d} no aparece en ninguna pantalla')

# T7: matriz de 04 §6.0.4 (avisos de estado por pantalla)
def rango(*xs): return {f'AV-{n:02d}' for n in xs}
matriz = {'/': rango(1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 17, 20, 23),
          '/presupuesto': rango(2, 3, 4, 5, 6, 7, 8, 9, 14, 17, 20),
          '/presupuesto/categorias/[categoriaId]': rango(2, 3, 4, 5, 6, 7, 8, 14, 17),
          '/cuentas': rango(7, 8, 9), '/cuentas/[cuentaId]': rango(4, 5, 6, 7, 8, 21),
          '/presupuesto/listo-para-asignar': rango(9, 20), '/por-cobrar': rango(9), '/metas': rango(17),
          '/bandeja': rango(23), '/notificaciones': rango(1, 23)}
def avisos_de(t):
    s = set(re.findall(r'AV-\d{2}', t))
    for a, b in re.findall(r'AV-(\d{2}) a AV-(\d{2})', t): s |= {f'AV-{n:02d}' for n in range(int(a), int(b) + 1)}
    for a, b, c in re.findall(r'AV-(\d{2}), AV-(\d{2}) y AV-(\d{2})', t): pass
    return s
for ruta, esperados in matriz.items():
    if ruta not in filas: falla('T7', f'{ruta} falta en §2'); continue
    faltan = esperados - avisos_de(filas[ruta]['avisos'])
    if faltan: falla('T7', f"{ruta} no muestra {', '.join(sorted(faltan))} (04 §6.0.4)")

# T8: todo destino de notificación (3.5) lleva a una ruta del mapa
dest_txt = seccion('### 3.5 Destinos de las notificaciones', '**Marca de leída al abrir.**')
destinos = re.findall(r'\| `[a-z]+`[^|]*\| `(/[^`?]*)', dest_txt)
for r in destinos:
    if r not in filas: falla('T8', f'el destino {r} no es una ruta de §2')

# T9 [R2]: todo parámetro de búsqueda del árbol (1.3) y del mapa (§2) está en el catálogo de 2.2, una sola vez
cat_txt = seccion('### 2.2 Parámetros de búsqueda', '**Conversión a los parámetros de la consulta.**')
catalogo = []
for linea in cat_txt.splitlines():
    if linea.startswith('| `?'):
        primera = linea.split(' | ')[0]
        catalogo += re.findall(r'`\?([a-z][a-z-]*)=', primera)
for n in {c for c in catalogo if catalogo.count(c) > 1}: falla('T9', f'?{n}= aparece más de una vez en el catálogo de 2.2')
usados = set(re.findall(r'[?&]([a-z][a-z-]*)=', bloque))
for f in filas.values(): usados |= set(re.findall(r'`\?([a-z][a-z-]*)=', f['consulta'] + ' ' + f['operaciones'] + ' ' + f['notas']))
usados |= set(re.findall(r'`\?([a-z][a-z-]*)=', seccion('## 3. Navegación', '## 7. Estados')))
for n in sorted(usados - set(catalogo)): falla('T9', f'?{n}= se usa en 1.3, §2 o §3 y no está en el catálogo de 2.2')

print(f'Árbol: {len(arbol)} rutas; mapa: {len(filas)} filas; consultas usadas: {len(usadas)}/{len(consultas)}; '
      f'variantes de formulario: {len(vistas & set(variantes))}/{len(variantes)}; operaciones: {len(presentes & todas)}/{len(todas)}; '
      f'avisos: {len(avisos_mapa)}/24; destinos de notificación: {len(destinos)}; parámetros: {len(usados)} usados, {len(catalogo)} en el catálogo')
print('\n'.join(errores) if errores else 'T1 a T9 pasan')
sys.exit(1 if errores else 0)
