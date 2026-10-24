# Construye el catálogo de objetivos completo (partes A a D) desde los documentos y las listas de cada parte.
import re, json, sys
# Uso: python3 -I tools/plan/catalogo.py <docs> <objetivos-parte-a.txt> <salida>
ARGS = sys.argv[1:] or ['/home/claude/fase8/verificacion/docs', '/home/claude/fase8/verificacion/plan/objetivos-parte-a.txt', '/home/claude/fase8/verificacion/plan/objetivos.txt']
D = ARGS[0].rstrip('/') + '/'
d01 = open(D + '01-dominio.md', encoding='utf8').read()
d04 = open(D + '04-backend.md', encoding='utf8').read()
d06 = open(D + '06-features.md', encoding='utf8').read()
d07 = open(D + '07-pruebas.md', encoding='utf8').read()

L = []  # (id, parte, fuente)
def add(i, p, f):
    L.append((i, p, f))

# ── Parte A (catálogo de la Parte A, con los ajustes de la revisión) ──
for line in open(ARGS[1], encoding='utf8'):
    if not re.match(r'^[A-Z]', line): continue
    i, p, f = [s.strip() for s in line.split('|')]
    if p != 'A': continue
    add(i, 'A', f)
add('CT-03', 'A', '07 §34 (CT-03: procedimientos manuales de Android y NVDA) [A2]')
add('DT-13', 'A', '08 §11.1 (permisos de Claude Code como barrera) [A2]')
add('DT-14', 'A', '08 §11.2 (clase portado en tamano.ts) [A2]')
add('DT-20', 'A', '08 §1.5 (revisión obligatoria por archivos de producción; resumen de pr:mergear) [B2]')
add('DT-33', 'A', '08 §37.3 (aprobación de las obligatorias solo con el mensaje del usuario; hook y archivo de aprobación) [F8]')

# ── Parte B: derivados de los documentos ──
ops = sorted(set(re.findall(r'^#### (OP-\d+)', d04, re.M)), key=lambda x: int(x[3:]))
for o in ops:
    add(o, 'B', '04 §3 (operación en @finn/aplicacion)')
    add(o + '@dom', 'B', '04 §2.4 y 01 §5 (comando de aplicar)')
for o in sorted(set(re.findall(r'^\| (OPT-\d+) \|', d04, re.M))):
    add(o, 'B', '04 §3.10')
for e in sorted(set(re.findall(r'^#### (ESC-\d+)', d01, re.M))):
    add(e + '@motor', 'B', '01 §8, 07 §12.3 (PRU-' + e + '@motor)')
    add(e + '@int', 'B', '01 §8, 07 §12.3 (PRU-' + e + '@int)')
sec6 = d01[d01.index('## 6. Invariantes'):d01.index('## 7. Ciclos de vida')]
for n in sorted({int(x) for x in re.findall(r'^(\d+)\. ', sec6, re.M)}):
    add(f'INV-{n:02d}', 'B', '01 §6 (M4)')
for c in sorted(set(re.findall(r'^\| (CB-\d+) \|', d01, re.M))): add(c, 'B', '01 §9 (M14)')
for a in sorted(set(re.findall(r'^\| (AV-\d+) \|', d01, re.M))): add(a, 'B', '01 §5.0.7 (M3)')
t63 = d06[d06.index('### 6.3 Consultas'):d06.index('### 6.4 Rutas')]
for q in sorted(set(re.findall(r'^\| `(\w+)\(\)` \|', t63, re.M))): add('Q-' + q, 'B', '04 §6, 06 §6.3')
for r in sorted(set(re.findall(r"^\| `reporte\('(\w+)'\)` \|", t63, re.M))): add('REP-' + r, 'B', '04 §6.9, 06 §3.5 y §6.3')
add('REP-datos_base', 'B', '04 §6.9.4 (CF-09)')
for f in sorted(set(re.findall(r"^\| `formulario\('(\w+)'\)` \|", t63, re.M))): add('FORM-' + f, 'B', '04 §6.14.4, 06 §6.3')

# BE de 04 §0.6 con su parte
be_c = {'BE-05': 'Server Actions y lista cerrada de Route Handlers (apps/web)', 'BE-06': 'bodySizeLimit de Next'}
for n in range(5, 64):
    b = f'BE-{n:02d}'
    add(b, 'C' if b in be_c else 'B', '04 §0.6' + (f' ({be_c[b]})' if b in be_c else ''))
add('BE-09-tipos', 'B', '04 §2.4 (tipos públicos)'); add('BE-09-calcular', 'B', '04 §2.4 (calcular y verificarInvariantes)')

# Migraciones
mig = {'MIG-00': 'bootstrap.sql (03 §10.4.1)', 'MIG-01': 'm_inicio', 'MIG-02': 'g_tablas', 'MIG-03': 'm_restricciones', 'MIG-04': 'm_funciones',
       'MIG-05': 'm_triggers', 'MIG-06': 'm_seguridad', 'MIG-07': 'm_datos_iniciales', 'MIG-08': 'm_purgar_eliminaciones (EN-2)',
       'MIG-09': 'g_conciliacion_modo (CF-01)', 'MIG-10': 'g_notificaciones_aviso_nulo (CF-16)', 'MIG-11': 'g_programadas_reactivada (CF-20)',
       'MIG-12': 'm_reloj (CT-02)', 'MIG-13': 'g_instantes_ahora (CT-02)', 'MIG-14': 'm_bloqueo_marca (CT-06)', 'MIG-15': 'm_formatos_bac (DT-12)',
       'MIG-schema': 'schema.prisma (03 §10.3)'}
for k, v in mig.items(): add(k, 'B', '03 §10.1 y Enmiendas: ' + v)
for c in ['C3', 'C4', 'C5', 'C6']: add(c, 'B', '03 §11.6')
for n in range(1, 16): add(f'R{n}', 'B', '03 §11.6' + (' (EN-2)' if n == 14 else ' (CT-02)' if n == 15 else ''))

# CF y CT con su parte
cf_b = ['CF-01', 'CF-02', 'CF-04', 'CF-05', 'CF-06', 'CF-07', 'CF-09', 'CF-14', 'CF-15', 'CF-16', 'CF-17', 'CF-18', 'CF-19', 'CF-20', 'CF-21', 'CF-22', 'CF-24', 'CF-25']
for c in cf_b: add(c, 'B', '06 §0.7')
for c in ['CF-08', 'CF-10', 'CF-11', 'CF-12', 'CF-13']: add(c, 'C', '06 §0.7 (web)')
add('CF-23', 'D', '06 §0.7 (web; FT-69, ficha [M]) [C]')
add('CF-03', 'D', '06 §0.7 (diferido; FT-49)')
for c, p, f in [('CT-01-escritura', 'B', 'escribir() y leer() fijan finn.hoy y finn.desfase_ms'), ('CT-01-funcion', 'B', 'relojPermitido() y relojDePrueba()'),
                ('CT-01-barrera1', 'C', 'instrumentation.ts (barrera 1)'), ('CT-01-barrera1b', 'C', 'vercel env ls en desplegar (barrera 1b)'),
                ('CT-02-base', 'B', 'm_reloj, R15 y reloj-simulado.sql'), ('CT-02-defaults', 'B', 'g_instantes_ahora'), ('CT-02-instante', 'B', 'finn.instante() en el paso 3 de 04 §4.2'),
                ('CT-05', 'B', 'oráculo'), ('CT-06', 'B', 'm_bloqueo_marca'), ('CT-07', 'B', 'semilla de A.7'), ('CT-08', 'B', 'scripts de la Fase 5'), ('CT-09', 'C', 'despliegue de emergencia y restauración semanal')]:
    add(c, p, '07 §34: ' + f)

# Decisiones de 07 y etiquetas propias de la Parte B (dueño único; fuente entre paréntesis)
propias_b = {
 'DP-05': '07 §5.2', 'DP-07': '07 §5.3', 'DP-13': '07 §12.3', 'DP-14': '07 §12.3', 'DP-16': '07 §12.3', 'DP-17': '07 §12.4', 'DP-23': '07 §19.2',
 'DP-26': '07 §19.4', 'DP-27': '07 §28.4', 'P7-12-disparador': '07 §32.1 (c4-explicar)', 'P7-12-a': '07 §4.4 (dbgenerated)', 'P7-12-b': '07 §32.1 (respaldo b)',
 'P7-2-pooler': '07 §5.3 (PgBouncer)', 'CH-03': '08 §7', 'CH-05': '08 §7', 'DT-12': '08 §6', 'ADR-15': '02', 'ADR-16': '02', 'ADR-17': '02',
 'ADR-22-scripts': '02 ADR-22, 03 §12', 'PR-1-valores': '02 Enmiendas (PR-1)', 'PR-2': '03 Enmiendas (PR-2)', 'EN-1': '03 Enmiendas', 'EN-2-tarea': '04 §10.2',
 'GEN-base': '07 §12.5', 'GEN-operaciones': '07 §12.5', 'MOT-5.0': '01 §5.0', 'MOT-AnexoA': '01 Anexo A', 'MOT-diferencial': '07 §3.1',
 'SEM-4.3': '07 §12.4', 'SEM-4.6': '07 §12.4', 'SEM-A7': '07 §28', 'DB-errores': '04 §7.3', 'DB-mapeo': '04 §13', 'DB-repositorios': '04 §1.2, 03 §3.28',
 'VOL-generador': '07 §12.7', 'APP-config': '04 §14.2', 'SMS-interprete': '04 §8.3', 'CI-politica-patrones': '04 §8.5, 07 §31.5', 'N-02-intentos': '02 N-02',
 'SP-01-anonimizar': '07 §23', 'SP-01-BAC': '04 SP-01, 08 §6', 'CONC-decodificar': '04 §9.3', 'CONC-BAC-tarjeta': '02 ADR-17', 'CONC-BAC-debito': '02 ADR-17',
 'CONC-Agricola': '02 ADR-17', 'NOTIF-catalogo': '04 §11.2', 'TAREA-diaria': '04 §10.2', 'TAREA-paso1': '04 §10.2 paso 1', 'TAREA-pasos3y4': '04 §10.2 pasos 3 y 4',
 'RESP-manifiesto': '03 §12.1', 'HUMO-base': '04 §17', 'HUMO-iad1-auth': '04 §17 (H-09, H-10)', 'TRZ-fases': '07 §13.7, §35',
}
for k in ['4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10', '4.12', '4.13', '4.14', '4.16', '4.17']: propias_b['MOT-' + k] = '01 §' + k
for s in ['inicio', 'presupuesto', 'detalleLpa', 'detalleCategoria', 'metas', 'estructura', 'cuentas', 'detalleCuenta', 'actividad', 'detalleTransaccion', 'bandeja', 'sugerencia', 'formulario', 'porCobrar', 'programadas']:
    propias_b['SEL-' + s] = '04 §6.0.5 (selectores de ' + s + ')'
for k, v in propias_b.items(): add(k, 'B', v)

# ── Partes C y D: derivados de los documentos ──
pri = {m.group(1): m.group(2) for m in re.finditer(r'^\| (FT-\d+)[^|]*\|[^|]*\| (I|M|P|—) \|', d06, re.M)}
fichas = {}
for m in re.finditer(r'^#### (FT-\d+) .*?(?=^#### FT-|^## |\Z)', d06, re.M | re.S):
    fichas[m.group(1)] = m.group(0)
nca = 0
for ft, txt in fichas.items():
    for ca in sorted(set(re.findall(r'^- \*\*(CA-\d+\.\d+)\b', txt, re.M)), key=lambda x: [int(y) for y in x[3:].split('.')]):
        add(ca, 'C' if pri.get(ft) == 'I' else 'D', f'06 {ft} [{pri.get(ft)}]'); nca += 1
t64 = d06[d06.index('### 6.4 Rutas'):d06.index('### 6.5 Escenarios')]
# [C] DT-23: la ruta de las ocurrencias la construye FT-41 [M]; /sin-conexion es la página del service worker (05 §8.5, TA-223)
RUTA_PARTE = {'/programadas/[programadaId]/ocurrencias/[fechaEsperada]': ('D', '[C] DT-23: la construye FT-41 [M]'),
              '/sin-conexion': ('C', '[C] DT-23: página del service worker (05 §8.5)')}
for m in re.finditer(r'^\| `(/[^`]*)` \| ([^|]+)\|', t64, re.M):
    fts = re.findall(r'FT-\d+', m.group(2))
    r = m.group(1)
    parte = 'C' if any(pri.get(f) == 'I' for f in fts) else 'D'
    if r in RUTA_PARTE: parte = RUTA_PARTE[r][0]
    add('RUTA-' + r, parte, '06 §6.4 (' + ', '.join(fts) + ')' + (' ' + RUTA_PARTE[r][1] if r in RUTA_PARTE else ''))
for r, f in [('RH-sms', '/api/sms'), ('RH-tareas-diaria', '/api/tareas/diaria'), ('RH-respaldo', '/api/respaldo/[evento]'), ('RH-exportar', '/api/exportar/[formato]'), ('RH-notificaciones-accion', '/api/notificaciones/accion')]:
    add(r, 'C', '04 §1.2 (Route Handler ' + f + ')')
# [C] Registro FE de 05 §0.10, salvo FE-22 (lint, Parte A); FE-32, FE-57 y FE-58 dependen de fichas [M]
d05 = open(D + '05-frontend.md', encoding='utf8').read()
for m in re.finditer(r'^\| (FE-\d+)[^|]*\| ([^|]+)\| ([^|]+)\|', d05, re.M):
    fe = m.group(1)
    if fe == 'FE-22' or fe in [x[0] for x in L]: continue
    add(fe, 'D' if fe in ('FE-32', 'FE-57', 'FE-58') else 'C', '05 §' + m.group(3).strip().lstrip('§') + ' [C]')
# [C] Recorridos de 06 §4: todos incluyen alguna ficha [M], así que su E2E va en la Parte D
for k in range(1, 7): add(f'REC-4.{k}', 'D', '06 §4.' + str(k) + ' (recorrido con fichas [M]) [C]')
add('SP-01-Agricola', 'D', '04 SP-01, CH-03: formatos de Banco Agrícola reescritos y F-2 activo (TU-14) [D]')
add('DT-27', 'D', '08 §27.1: CA pendientes de punta a punta en la matriz (P8-19.1) [D]')
for k, v in {'WF-respaldo': '07 §6.1', 'WF-restauracion': '07 §6.1', 'WF-desplegar': '07 §6.1', 'DP-22': '07 §19.1', 'DP-29': '07 §31.1', 'AUTH-funciones': '04 §12.2'}.items():
    add(k, 'C', v)

# PRU definidos en 07, con su parte (los de ejemplo y los renombrados no son objetivos)
EJEMPLOS = {'PRU-CMP-TARJ-002', 'PRU-CMP-TARJ-003', 'PRU-DOM-TARJ-003', 'PRU-E2E-INICIO-008', 'PRU-E2E-PRES-012', 'PRU-E2E-TARJ-002',
            'PRU-E2E-TARJ-003', 'PRU-INT-TARJ-003', 'PRU-INT-TARJ-004', 'PRU-RH-TARJ-003'}
RENOMBRADOS = {'PRU-SEG-MAN-001', 'PRU-MAN-SEG-001'}
definidos = sorted(set(re.findall(r'PRU-[A-Z0-9]+-[A-Z0-9]+-\d{3}', d07)) - EJEMPLOS - RENOMBRADOS)
definidos = sorted(set(definidos) | {'PRU-INT-POOL-001', 'PRU-INT-POOL-003', 'PRU-INT-POOL-005', 'PRU-SEG-CONC-001'})  # CH-05, CH-06 ([F8]: ya definidos en 07 enmendado)
A_PRU = {'PRU-SEG-OPER-001', 'PRU-SEG-OPER-002', 'PRU-DOM-VAL-006'}
B_PRU = {'PRU-INT-ESQ-001', 'PRU-INT-ESQ-002', 'PRU-INT-ESQ-003', 'PRU-INT-ESQ-004', 'PRU-INT-ESQ-005', 'PRU-INT-ESQ-006', 'PRU-INT-ESQ-007',
         'PRU-INT-ESQ-008', 'PRU-INT-ESQ-009', 'PRU-INT-ESQ-010', 'PRU-INT-ESQ-012', 'PRU-SEG-ESQ-001', 'PRU-INT-POOL-001', 'PRU-INT-POOL-002',
         'PRU-INT-POOL-003', 'PRU-INT-POOL-004', 'PRU-INT-POOL-005', 'PRU-INT-POOL-006', 'PRU-ESQ-POOL-001', 'PRU-ESQ-ESQ-001', 'PRU-ESQ-RELOJ-003',
         'PRU-ESQ-RELOJ-004', 'PRU-ESQ-RELOJ-005', 'PRU-INT-NOTIF-001', 'PRU-INT-NOTIF-002', 'PRU-INT-MOTOR-001', 'PRU-INT-VAL-001', 'PRU-INT-VAL-002',
         'PRU-INT-VAL-003', 'PRU-DOM-VAL-001', 'PRU-DOM-VAL-002', 'PRU-DOM-VAL-003', 'PRU-DOM-BAND-001', 'PRU-DOM-BAND-002', 'PRU-DOM-CONC-001',
         'PRU-CTR-BAND-001', 'PRU-INT-BAND-001', 'PRU-SEG-BAND-002', 'PRU-SEG-RELOJ-002', 'PRU-REN-MOTOR-001', 'PRU-REN-ESQ-001',
         'PRU-PROP-REP-001', 'PRU-PROP-REP-002', 'PRU-PROP-REP-003', 'PRU-PROP-REP-004', 'PRU-DOM-REP-001', 'PRU-DOM-MOTOR-901', 'PRU-DOM-MOTOR-902',
         'PRU-DOM-MOTOR-903', 'PRU-DOM-MOTOR-904', 'PRU-INT-RELOJ-010', 'PRU-SEG-CONC-001'}
D_PRU = {'PRU-SW-NOTIF-001', 'PRU-E2E-BAND-001', 'PRU-REN-BAND-001'}  # [C] push (FT-71) y arrastre de la Bandeja ([M])
for p in definidos:
    parte = 'A' if (p in A_PRU or p.startswith('PRU-MAN-')) else 'B' if p in B_PRU else 'D' if p in D_PRU else 'C'
    add(p, parte, '07' + (' (CH-05)' if p in ('PRU-INT-POOL-001', 'PRU-INT-POOL-003', 'PRU-INT-POOL-005') else ' (CH-06)' if p == 'PRU-SEG-CONC-001' else ' (CH-04)' if p == 'PRU-MAN-CTA-002' else ''))

ids = [x[0] for x in L]
dup = [i for i in set(ids) if ids.count(i) > 1]
assert not dup, dup
with open(ARGS[2], 'w', encoding='utf8') as f:
    f.write('# Objetivos del plan de la Fase 8: id | parte | fuente. Generado por catalogo.py desde docs/ (01, 04, 06, 07)\n')
    f.write('# y las listas de cada parte; `verificar.ts --docs` comprueba que no falte ningún objetivo derivado de los documentos.\n')
    for i, p, src in L: f.write(f'{i} | {p} | {src}\n')
import collections
print(collections.Counter(p for _, p, _ in L), 'CA:', nca)
if not sys.argv[1:]:
    b_cat = {i for i, p, _ in L if p == 'B'}
    cub = set(json.load(open('/home/claude/fase8/trabajo/gen/cubre_b.json')))
    print('en catálogo B sin tarea (sin contar PRU):', sorted(x for x in b_cat - cub if not x.startswith('PRU-')))
    print('en tareas sin catálogo:', sorted(cub - {i for i, _, _ in L}))
    c_cat = {i for i, p, _ in L if p == 'C'}
    cubc = set(json.load(open('/home/claude/fase8/trabajo/gen/cubre_c.json')))
    print('C sin tarea (sin PRU):', sorted(x for x in c_cat - cubc if not x.startswith('PRU-')))
    print('C en tareas sin catálogo:', sorted(cubc - {i for i, _, _ in L}))
    d_cat = {i for i, p, _ in L if p == 'D'}
    cubd = set(json.load(open('/home/claude/fase8/trabajo/gen/cubre_d.json')))
    print('D sin tarea (sin PRU):', sorted(x for x in d_cat - cubd if not x.startswith('PRU-')))
    print('D en tareas sin catálogo:', sorted(cubd - {i for i, _, _ in L}))
