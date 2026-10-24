#!/usr/bin/env python3
"""V-29 / BE-63: verifica la trazabilidad de §18 contra §3 y §6 de 04-backend.md.
Uso: python3 t17.py <04-backend.md>   (sale con 1 si alguna regla falla)"""
import re, sys

texto = open(sys.argv[1], encoding='utf-8').read()

def seccion(inicio, fin):
    i = texto.index(inicio); j = texto.index(fin, i)
    return texto[i:j]

# Universo de operaciones (índice 3.0.8)
indice = seccion('#### 3.0.8 Índice', '#### 3.0.9')
ops = set(re.findall(r'^\| \**(OP-\d\d)\**', indice, re.M))
if 'OPT-01 … OPT-09' in indice:
    ops |= {f'OPT-{i:02d}' for i in range(1, 10)}
# Universo de consultas: 4.3 + encabezados de §6
s6 = seccion('## 6. Catálogo de consultas por pantalla', '\n## 8.')
consultas = {'4.3'} | set(re.findall(r'^#{3,4} (6(?:\.\d+)+)\b', s6, re.M))
# Catálogo de rechazos (3.0.6)
cat = seccion('#### 3.0.6 Catálogo de rechazos del dominio', '#### 3.0.7')
rechazos = set(re.findall(r'^\| `([a-z_]+)`', cat, re.M))

def filas(tabla_inicio, tabla_fin, prefijo):
    t = seccion(tabla_inicio, tabla_fin)
    return [[c.strip() for c in l.strip().strip('|').split('|')] for l in t.splitlines() if l.startswith(f'| {prefijo}-')]

esc = filas('### 18.2', '### 18.3', 'ESC')
av = filas('### 18.3', '### 18.4', 'AV')
errores, usadas = [], set()

def revisar(nombre, filas_, esperados, col_ops, col_cons):
    ids = [f[0] for f in filas_]
    for e in esperados:
        n = ids.count(e)
        if n != 1: errores.append(f'{nombre}: {e} aparece {n} veces')
    for x in set(ids) - set(esperados): errores.append(f'{nombre}: {x} no existe en 01')
    for f in filas_:
        o = re.findall(r'\bOPT?-\d\d\b', f[col_ops])
        c = re.findall(r'(?<![\d.])(4\.3|6(?:\.\d+)+)(?![\d.])', f[col_cons])
        if not o: errores.append(f'{f[0]}: sin operación (T3)')
        if not c: errores.append(f'{f[0]}: sin consulta (T3)')
        for x in o:
            usadas.add(x)
            if x not in ops: errores.append(f'{f[0]}: {x} no está en 3.0.8 (T4)')
        for x in c:
            if x not in consultas: errores.append(f'{f[0]}: consulta {x} no existe (T5)')

revisar('ESC (T1)', esc, [f'ESC-{i:02d}' for i in range(1, 51)], 2, 3)
revisar('AV (T2)', av, [f'AV-{i:02d}' for i in range(1, 25)], 3, 4)
ids_av = {f[0] for f in av}
for f in esc:
    for x in re.findall(r'\bAV-\d\d\b', f[4]):
        if x not in ids_av: errores.append(f'{f[0]}: {x} no está en 18.3 (T6)')
    for x in re.findall(r'rechazo `([a-z_]+)`', f[4]):
        if x not in rechazos: errores.append(f'{f[0]}: rechazo {x} no está en 3.0.6 (T7)')

print(f'escenarios: {len(esc)}  avisos: {len(av)}  operaciones en 3.0.8: {len(ops)}  consultas: {len(consultas)}  rechazos: {len(rechazos)}')
sin = sorted(ops - usadas, key=lambda x: (x.startswith('OPT'), x))
print('informativo — operaciones sin escenario ni aviso:', ', '.join(sin))
if errores:
    print('FALLA'); [print('  ' + e) for e in errores]; sys.exit(1)
print('PASA: T1 a T7')
