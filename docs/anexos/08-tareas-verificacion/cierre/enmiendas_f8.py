# Control de las enmiendas [F8] (como enmiendas_f7.py de la Fase 7). Uso: python3 -I enmiendas_f8.py <orig> <enmendados> [--negativo]
import difflib, os, re, sys
ORIG, ENM = sys.argv[1], sys.argv[2]
DOCS = ['04-backend.md', '06-features.md', '07-pruebas.md']
CH_DOC = {'CH-01': '07-pruebas.md', 'CH-02': '07-pruebas.md', 'CH-03': '07-pruebas.md', 'CH-04': '07-pruebas.md', 'CH-05': '07-pruebas.md',
          'CH-06': '07-pruebas.md', 'CH-07': '06-features.md', 'CH-08': '07-pruebas.md'}
FILAS_NUEVAS = {'07-pruebas.md': 6, '06-features.md': 0, '04-backend.md': 0}  # 13.2, 13.3, 19.1, 22.1, 27, 30

def lee(d, n): return open(os.path.join(d, n), encoding='utf8').read()

def controlar(orig, enm):
    errores = []
    for ch, n in CH_DOC.items():
        if f'({ch})' not in enm[n] and f'{ch}:' not in enm[n] and f'**{ch}**' not in enm[n]: errores.append(f'E1 {ch} no está en {n}')
    if 'CH-03' not in enm['04-backend.md'].split('## Enmiendas posteriores')[-1]: errores.append('E1 CH-03 sin línea en las enmiendas de 04')
    for n in DOCS:
        partes = enm[n].split('## Enmiendas posteriores')
        if len(partes) < 2 or 'Fase 8' not in partes[-1]: errores.append(f'E2 {n} sin la línea de la Fase 8 en "Enmiendas posteriores"')
    for n in DOCS:
        a, b = orig[n].split('\n'), enm[n].split('\n')
        cola = enm[n].rfind('## Enmiendas posteriores')
        inicio_cola = enm[n][:cola].count('\n') if cola >= 0 else len(b)
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
            if op == 'equal': continue
            if op == 'delete': errores.append(f'E3 {n}: líneas borradas {i1 + 1}-{i2}'); continue
            for j in range(j1, j2):
                linea = b[j]
                if j >= inicio_cola - 2 or linea.strip() in ('', '---') or '[F8]' in linea or 'Enmiendas posteriores' in linea or 'Aprobadas en fases posteriores' in linea: continue
                errores.append(f'E3 {n}:{j + 1} cambio sin marca [F8]: {linea[:80]}')
    for n in DOCS:
        fo = len(re.findall(r'^\|', orig[n], re.M)); fe = len(re.findall(r'^\|', enm[n], re.M))
        if fe - fo != FILAS_NUEVAS[n]: errores.append(f'E4 {n}: {fe - fo} filas de tabla nuevas, se esperaban {FILAS_NUEVAS[n]}')
    ca = lambda t: re.findall(r'^- \*\*CA-\d+\.\d+.*$', t, re.M)
    if ca(orig['06-features.md']) != ca(enm['06-features.md']): errores.append('E5 algún CA de 06 cambió')
    if len(ca(enm['06-features.md'])) != 492: errores.append(f'E5 06 tiene {len(ca(enm["06-features.md"]))} CA')
    return errores

orig = {n: lee(ORIG, n) for n in DOCS}; enm = {n: lee(ENM, n) for n in DOCS}
e = controlar(orig, enm)
print(f'Documentos: {", ".join(DOCS)}. CA de 06: {len(re.findall(r"^- \*\*CA-", enm["06-features.md"], re.M))}. Marcas [F8]: ' + ', '.join(f'{n} {enm[n].count("[F8]")}' for n in DOCS))
for x in e: print('ERROR', x)
fallo = bool(e)
if '--negativo' in sys.argv:
    m1 = dict(enm); m1['07-pruebas.md'] = m1['07-pruebas.md'].replace(' **[F8]** (CH-02) |', ' |', 1)
    m2 = dict(enm); m2['06-features.md'] = m2['06-features.md'].replace('- **CA-30.4**', '- **CA-30.4** x', 1)
    m3 = dict(enm); m3['04-backend.md'] = m3['04-backend.md'].replace('- **CH-03** (Fase 8', '- (Fase 8', 1)
    r = [any(x.startswith('E3') for x in controlar(orig, m1)), any(x.startswith('E5') for x in controlar(orig, m2)), any(x.startswith('E1') for x in controlar(orig, m3))]
    print(f'Control negativo: marca quitada {"detectada" if r[0] else "NO"}; CA cambiado {"detectado" if r[1] else "NO"}; línea de 04 quitada {"detectada" if r[2] else "NO"}.')
    fallo = fallo or not all(r)
print('RESULTADO: FALLA' if fallo else 'RESULTADO: PASA')
sys.exit(1 if fallo else 0)
