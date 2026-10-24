"""Revisión mecánica de las fichas de 06-features.md (Parte B): bloques, códigos, rutas, ESC y AV."""
import re, sys
doc = open(sys.argv[1]).read()
ref04 = open(sys.argv[2]).read(); ref05 = open(sys.argv[3]).read()
fichas = re.split(r'\n#### (?=FT-\d\d )', doc.split('## 2. Fichas por feature', 1)[1].split('# Parte E', 1)[0])[1:]  # [E] las fichas terminan donde empieza la Parte E
hasta = int(sys.argv[4]) if len(sys.argv) > 4 else 33
esperadas = [f'FT-{n:02d}' for n in list(range(1, 7)) + list(range(8, hasta + 1))]
if hasta >= 40: esperadas.insert(esperadas.index('FT-40'), 'FT-78')  # [R3] FT-78 va al final de 2.5, después de FT-39
fallos, esc, av, nca = [], set(), set(), 0
codigos = set(re.findall(r'^\| `([a-z_0-9]+)`', ref04, re.M)) | set(re.findall(r'`([a-z_]+)`, `([a-z_]+)`', ref04) and [])
codigos |= {c for par in re.findall(r'^\| `([a-z_0-9]+)`, `([a-z_0-9]+)`', ref04, re.M) for c in par}
codigos |= set(re.findall(r'^\| `([a-z_0-9]+)` \|', ref05, re.M))
codigos |= {'conflicto_desactualizado', 'conflicto_id', 'no_encontrado'}
codigos |= {'transaccion_fuera_de_verificacion', 'arrastre_no_permitido'}
codigos |= set(re.findall(r'\| `(patron_[a-z_]+|banderas_[a-z_]+|grupos_[a-z_]+)`', ref04))  # política de 04 §8.5  # nuevos en 06: §3.2.2 (CF-01) y 0.13 (CF-21)
rutas05 = set(re.findall(r'^\| `(/[^`]*)` \|', ref05, re.M)) | {'/presupuesto/estructura/plantilla', '/cuentas/[cuentaId]/verificar-saldo', '/por-cobrar/deudores/[deudorId]/unir'}  # CF-08, CF-01, CF-03
rutas05 |= {'/registrar/' + t for t in re.findall(r'^\| `([a-z-]+)` \| `[a-z_]+` \| OP-', ref05, re.M)}  # [tipo] de 05 §2.4
rutas05 |= {'/reportes/' + t for t in re.findall(r'^\| `([a-z-]+)` \| `[a-z_]+` \| ', ref05, re.M)}  # [tipo] de 05 §2.10
rutas05 |= {'/reportes/' + t for t in ('ritmo', 'realidad', 'hormiga', 'suscripciones', 'tarjetas', 'hallazgos', 'flujo-efectivo')}  # CF-04, CF-02
vistas = []
for f in fichas:
    f = f.split('\n### ', 1)[0]  # [R5] la ficha termina en el siguiente encabezado de sección
    ft = f[:5]; vistas.append(ft)
    abreviada = 'ficha abreviada' in f.split('\n', 1)[0]
    bloques = ['**Objetivo.**', '**Criterios de aceptación.**', '**Escenarios.**', '**Dependencias.**'] + \
              ([] if abreviada else ['**Historias.**', '**Flujo.**', '**Piezas.**', '**Reglas.**', '**Estados.**', '**Errores y textos.**', '**Avisos.**'])
    for b in bloques:
        if b not in f: fallos.append(f'{ft}: falta {b}')
    cas = re.findall(r'\*\*CA-(\d\d)\.(\d+)', f)
    nca += len(cas)
    if any(a != ft[3:] for a, _ in cas): fallos.append(f'{ft}: criterio con número de otra feature')
    if [int(m) for _, m in cas] != list(range(1, len(cas) + 1)): fallos.append(f'{ft}: criterios no consecutivos')
    if len(cas) < 3: fallos.append(f'{ft}: menos de 3 criterios')
    for linea in f.splitlines():
        if linea.startswith('**Escenarios.**'): esc |= set(re.findall(r'ESC-\d\d', linea))
        if linea.startswith('**Avisos.**') or '**Avisos.**' in linea: av |= set(re.findall(r'AV-\d\d', linea.split('**Avisos.**')[-1]))
    errores = re.search(r'\*\*Errores y textos\.\*\*(.*)', f)
    if errores:
        for c in re.findall(r'`([a-z][a-z_0-9]+)`', errores.group(1)):
            if c not in codigos: fallos.append(f'{ft}: código desconocido {c}')
    for r in re.findall(r'`(/[a-z][^`?\s]*)', f):
        base = r.rstrip('/')
        if base not in rutas05 and not base.startswith('/api/') and base not in ('/serwist/sw.js.map',):
            fallos.append(f'{ft}: ruta fuera de 05 §2 {r}')
if vistas != esperadas: fallos.append(f'fichas {vistas} ≠ {esperadas}')
print(f'Fichas: {len(vistas)}; criterios: {nca}')
print('ESC cubiertos en las fichas:', len(esc), sorted(esc))
print('AV cubiertos en las fichas:', len(av), sorted(av))
print('RESULTADO:', 'PASA' if not fallos else 'FALLA')
for x in fallos: print('  -', x)
