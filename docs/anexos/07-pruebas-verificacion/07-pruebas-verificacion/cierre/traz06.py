"""Trazabilidad de 06-features.md (§6) contra 04 y 05.

Uso: python3 trazabilidad.py 06-features.md 04.md 05.md [--negativo]

T1  Cada operación OP-01..OP-52 y OPT-01..OPT-09 de 04 aparece en al menos una ficha.
T2  Cada consulta de 04 §6 (consultas.x), cada tipo de reporte de 04 §6.9.2 y de 05 §2.10, y cada
    contexto de formulario de 04 §6.14.4 aparece en al menos una ficha.
T3  Cada ruta de 05 §1.3 ([P], [S], [D], [C], [L], acceso, estática y redirección), más las rutas nuevas de los CF, aparece en al menos una ficha.
T4  Cada ficha cita al menos una operación o una consulta.
T5  ESC-01..ESC-50 y AV-01..AV-24 aparecen en el bloque Escenarios o Avisos de al menos una ficha.
T6  Cada CF de 0.7 (salvo los diferidos) aparece en al menos una ficha, en §3 o en §5.
T7  Los recorridos de §4 citan solo fichas que existen, y cada paso tiene una ficha.
T8  Toda feature del catálogo (§1) tiene ficha, y toda ficha está en el catálogo.

Con --negativo, quita una ficha (FT-41), una ruta de una ficha, un escenario y una referencia de un
recorrido, y comprueba que T1 a T8 detectan cada falta.
"""
import re, sys
from collections import defaultdict

SOLO_CLIENTE = {'FT-05', 'FT-77'}  # instalación y tema: sin operación ni consulta del servidor (05 §8, §10.6)


def tabla_tras(texto, encabezado):
    """Primera tabla markdown después de una línea que empieza con `encabezado`."""
    i = texto.find(encabezado)
    if i < 0:
        return []
    filas, dentro = [], False
    for linea in texto[i:].splitlines()[1:]:
        if linea.startswith('|'):
            dentro = True
            filas.append(linea)
        elif dentro:
            break
    return filas[2:]


def catalogos(r04, r05):
    ops = sorted(set(re.findall(r'^#### (OP-\d\d) ', r04, re.M)))
    opt = sorted(set(re.findall(r'^\| (OPT-\d\d) \|', r04, re.M)))
    ops = sorted(set(ops) | {'OP-53'})  # CF-01, sin repetir si 04 ya está enmendado; OP-54 (CF-03) queda diferido
    assert 'OP-54' not in ops, 'OP-54 está diferida'
    consultas = sorted(set(re.findall(r'consultas\.([a-z][A-Za-z]+)\(', r04)))
    rep04 = [re.match(r'\| `([a-z_]+)`', f).group(1) for f in tabla_tras(r04, '#### 6.9.2') if re.match(r'\| `[a-z_]+`', f)]
    rep04 += ['gasto_semanal']  # 6.9.3
    formularios = [re.match(r'\| `([a-z_]+)`', f).group(1) for f in tabla_tras(r04, '#### 6.14.4') if re.match(r'\| `[a-z_]+`', f)]
    rutas = sorted(set(re.findall(r'^\| `(/[^`]*)` \| (?:\[[PSCLD]\]|Acceso|Estática|Redirección) \|', r05, re.M)))
    rutas += ['/presupuesto/estructura/plantilla', '/cuentas/[cuentaId]/verificar-saldo']  # CF-08, CF-01
    rep_nuevos = ['ritmo', 'realidad', 'hormiga', 'suscripciones', 'tarjetas', 'hallazgos', 'flujo_efectivo']  # CF-04, CF-02
    esc = [f'ESC-{n:02d}' for n in range(1, 51)]
    av = [f'AV-{n:02d}' for n in range(1, 25)]
    for x in esc + av:
        assert x in r04, f'{x} no está en 04'
    return dict(ops=ops + opt, consultas=consultas, reportes=sorted(set(rep04)) + rep_nuevos,
                formularios=formularios, rutas=rutas, esc=esc, av=av)


def partes(doc):
    cuerpo = doc.split('## 2. Fichas por feature', 1)[1].split('# Parte E', 1)[0]
    fichas = {}
    for bloque in re.split(r'\n#### (?=FT-\d\d )', cuerpo)[1:]:
        fichas[bloque[:5]] = bloque.split('\n### ', 1)[0]  # [R5] la ficha termina en el siguiente encabezado de sección
    sec1 = doc.split('## 1. Catálogo de features', 1)[1].split('\n## ', 1)[0]
    catalogo = {m.group(1) for m in re.finditer(r'^\| (FT-\d\d)\b.*$', sec1, re.M) if 'Retirada' not in m.group(0)}
    seccion3 = doc.split('## 3. Resolución de las preguntas abiertas', 1)[1].split('## 2. Fichas por feature', 1)[0]
    recorridos = doc.split('## 4. Recorridos de punta a punta', 1)[1].split('## 5. ', 1)[0] if '## 4. Recorridos' in doc else ''
    seccion5 = doc.split('## 5. Coherencia', 1)[1].split('## 6. ', 1)[0] if '## 5. Coherencia' in doc else ''
    registro_cf = doc.split('### 0.7', 1)[1].split('### 0.8', 1)[0]
    cfs = {}
    for f in registro_cf.splitlines():
        m = re.match(r'\| (CF-\d\d)\b', f)
        if m:
            cfs[m.group(1)] = 'diferido' in f.lower()
    return fichas, catalogo, seccion3, seccion5, recorridos, cfs


def revisar(doc, r04, r05):
    cat = catalogos(r04, r05)
    fichas, catalogo, seccion3, seccion5, recorridos, cfs = partes(doc)
    todo = '\n'.join(fichas.values())
    fallos, cobertura = [], defaultdict(list)

    def quien(patron):
        return [ft for ft, t in fichas.items() if re.search(patron, t)]

    # T1
    for op in cat['ops']:
        fts = quien(re.escape(op) + r'(?!\d)')
        cobertura['T1'].append((op, fts))
        if not fts: fallos.append(f'T1: {op} sin ficha')
    # T2
    for c in cat['consultas']:
        fts = quien(r'`' + c + r'(\(\)|\(|`)|\b' + c + r'\(\)')
        cobertura['T2'].append((c + '()', fts))
        if not fts: fallos.append(f'T2: consulta {c}() sin ficha')
    for r in cat['reportes']:
        fts = quien(r"`" + r + r"`|`" + r.replace('_', '-') + r"`|/reportes/" + r.replace('_', '-') + r"\b|reporte\('" + r)
        cobertura['T2'].append(("reporte('" + r + "')", fts))
        if not fts: fallos.append(f'T2: reporte {r} sin ficha')
    for f in cat['formularios']:
        fts = quien(r"`" + f + r"`|'" + f + r"'")
        cobertura['T2'].append(("formulario('" + f + "')", fts))
        if not fts: fallos.append(f'T2: formulario {f} sin ficha')
    # T3
    for ruta in cat['rutas']:
        patron = re.sub(r'\\\[tipo\\\]', r'(\\[tipo\\]|[a-z-]+)', re.escape(ruta))  # [tipo]: basta una ruta concreta
        fts = quien(r'`' + patron + r'[`?]')
        cobertura['T3'].append((ruta, fts))
        if not fts: fallos.append(f'T3: ruta {ruta} sin ficha')
    # T4
    for ft, t in fichas.items():
        if not re.search(r'OPT?-\d\d|`?[a-z][A-Za-z]+\(\)`?|consultas\.|reporte\(', t):
            if ft in SOLO_CLIENTE and re.search(r'`/[a-z]', t):
                continue  # feature del cliente: basta su ruta
            fallos.append(f'T4: {ft} no cita operación ni consulta')
    # T5
    esc, av = defaultdict(list), defaultdict(list)
    for ft, t in fichas.items():
        for linea in t.splitlines():
            if linea.startswith('**Escenarios.**'):
                for e in re.findall(r'ESC-\d\d', linea): esc[e].append(ft)
            if '**Avisos.**' in linea:
                for a in re.findall(r'AV-\d\d', linea.split('**Avisos.**')[-1]): av[a].append(ft)
    for e in cat['esc']:
        cobertura['T5'].append((e, esc[e]))
        if not esc[e]: fallos.append(f'T5: {e} sin ficha')
    for a in cat['av']:
        cobertura['T5'].append((a, av[a]))
        if not av[a]: fallos.append(f'T5: {a} sin ficha')
    # T6
    for cf, diferido in cfs.items():
        fts = quien(re.escape(cf) + r'(?!\d)')
        en3 = re.search(re.escape(cf) + r'(?!\d)', seccion3) is not None
        en5 = re.search(re.escape(cf) + r'(?!\d)', seccion5) is not None
        cobertura['T6'].append((cf, fts + (['§3'] if en3 else []) + (['§5'] if en5 else []) + (['diferido'] if diferido else [])))
        if not fts and not en3 and not en5 and not diferido: fallos.append(f'T6: {cf} sin ficha, §3 ni §5')
    # T7
    if not recorridos:
        fallos.append('T7: no hay §4')
    pasos = 0
    for linea in recorridos.splitlines():
        if re.match(r'\| \d+ \|', linea):
            pasos += 1
            citas = re.findall(r'FT-\d\d', linea.rsplit('|', 2)[-2])
            if not citas: fallos.append(f'T7: paso sin ficha: {linea[:60]}')
            for c in citas:
                if c not in fichas: fallos.append(f'T7: {c} citada en un recorrido no existe')
    # T8
    for ft in catalogo - set(fichas): fallos.append(f'T8: {ft} en el catálogo sin ficha')
    for ft in set(fichas) - catalogo: fallos.append(f'T8: {ft} con ficha y fuera del catálogo')
    resumen = dict(fichas=len(fichas), ops=len(cat['ops']), consultas=len(cat['consultas']),
                   reportes=len(cat['reportes']), formularios=len(cat['formularios']), rutas=len(cat['rutas']),
                   esc=len(cat['esc']), av=len(cat['av']), cfs=len(cfs), pasos=pasos)
    return fallos, cobertura, resumen


def negativo(doc, r04, r05):
    casos = []
    # 1) quitar FT-41 del cuerpo de fichas (su ficha y su fila en el catálogo quedan desparejas)
    i = doc.index('\n#### FT-41 '); j = doc.index('\n#### ', i + 5)
    casos.append(('quitar la ficha FT-41', doc[:i] + doc[j:], ('T8', 'T7', 'T1', 'T5')))
    # 2) quitar todas las menciones de una ruta de las fichas
    casos.append(('quitar /reglas de las fichas', re.sub(r'`/reglas`', '`/x`', doc), ('T3',)))
    # 3) quitar un escenario
    casos.append(('quitar ESC-46 de los bloques Escenarios', re.sub(r'(\*\*Escenarios\.\*\*[^\n]*?)ESC-46', r'\1ESC-xx', doc), ('T5',)))
    # 4) referencia rota en un recorrido
    k = doc.index('## 4. Recorridos de punta a punta')
    casos.append(('cambiar FT-50 por FT-99 en §4', doc[:k] + doc[k:].replace('| FT-50 |', '| FT-99 |', 1), ('T7',)))
    # 5) quitar una operación
    casos.append(('quitar OP-26', re.sub(r'OP-26(?!\d)', 'OP-xx', doc), ('T1',)))
    base = set(revisar(doc, r04, r05)[0])
    resultado = []
    for nombre, d, esperados in casos:
        fallos, _, _ = revisar(d, r04, r05)
        detectados = sorted({f[:2] for f in set(fallos) - base})
        ok = any(e in detectados for e in esperados)
        resultado.append((nombre, detectados, ok))
    return resultado


if __name__ == '__main__':
    doc, r04, r05 = (open(p).read() for p in sys.argv[1:4])
    fallos, cobertura, resumen = revisar(doc, r04, r05)
    print('Resumen:', resumen)
    if '--tablas' in sys.argv:
        for t, filas in cobertura.items():
            print(f'\n[{t}]')
            for x, fts in filas: print(f'{x}\t{", ".join(fts)}')
    print('RESULTADO:', 'PASA' if not fallos else 'FALLA')
    for f in fallos: print('  -', f)
    if '--negativo' in sys.argv:
        print('\nControl negativo:')
        bien = True
        for nombre, det, ok in negativo(doc, r04, r05):
            print(f'  {"detecta" if ok else "NO DETECTA"}: {nombre} → {det}')
            bien &= ok
        print('CONTROL NEGATIVO:', 'PASA' if bien else 'FALLA')
