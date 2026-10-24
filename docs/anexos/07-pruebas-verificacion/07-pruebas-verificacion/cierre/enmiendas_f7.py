"""V7-18: revisa las enmiendas de la Fase 7 (al estilo de V6-12).
E1 cada CT aplicado aparece en su documento enmendado.  E2 la última sección es "Enmiendas posteriores" con una línea de la Fase 7.
E3 00 y 01 no cambian; 02 y 03 solo cambian al final (el original es prefijo).  E4 04, 05, 06 e identidad: cada CT aplicado tiene
al menos una marca [F7] fuera de la sección de enmiendas.  E5 ninguna tabla cambió su cantidad de filas ni de columnas.
E6 los 492 CA de 06 siguen iguales (mismo texto de la línea del CA). E5 exceptúa las tablas que CT-08 cambia a propósito (05 §2.3, §15.1, §15.2)."""
import re, sys, pathlib
O, E = map(pathlib.Path, sys.argv[1:3]); neg = '--negativo' in sys.argv; ct09 = '--sin-ct09' not in sys.argv
CT = {'02-tecnologias.md': ['CT-01', 'CT-04', 'CT-05'], '03-base-de-datos.md': ['CT-02', 'CT-06'], '04-backend.md': ['CT-01', 'CT-02', 'CT-06'],
      '05-frontend.md': ['CT-01', 'CT-03', 'CT-04', 'CT-07', 'CT-08'], '06-features.md': ['CT-03', 'CT-07'], '06-identidad-visual.md': ['CT-07']}
if ct09: CT['02-tecnologias.md'].append('CT-09'); CT['04-backend.md'].append('CT-09')
fallos = []
def tablas(t): return [l.count('|') for l in t.split('\n') if l.startswith('|')]
def sin_ct08(t):   # E5: CT-08 cambia a propósito las tablas de 05 §2.3 (una fila) y §15.1–15.2 (regeneradas); el resto debe quedar igual
    for d, h in (('### 2.3 Inicio y Presupuesto', '### 2.4 Registrar'), ('### 15.1 Consultas', '### 15.3 Funciones')):
        if d in t: i = t.index(d); t = t[:i] + t[t.index(h, i):]
    return t
for f in sorted(p.name for p in O.glob('*.md')):
    a = (O / f).read_text(encoding='utf-8'); b = (E / f).read_text(encoding='utf-8')
    if neg and f == '05-frontend.md': b = b.replace('**CT-03.**', '**CT-0x.**')               # control negativo: falta una marca
    if neg and f == '03-base-de-datos.md': b = b.replace('### 4.1 Funciones auxiliares', '### 4.1 Funciones auxiliares (editado)')
    if f in ('00-decisiones.md', '01-dominio.md'):
        if a != b: fallos.append(f'E3 {f} cambió')
        continue
    for ct in CT[f]:
        if ct not in b.split('## Enmiendas posteriores')[-1]: fallos.append(f'E1 {f}: {ct} no está en las enmiendas')
    ult = b.split('\n## ')[-1]
    if not ult.startswith('Enmiendas posteriores') or 'Fase 7' not in ult: fallos.append(f'E2 {f}: la última sección no tiene la línea de la Fase 7')
    if f in ('02-tecnologias.md', '03-base-de-datos.md') and not b.startswith(a.rstrip('\n')): fallos.append(f'E3 {f}: cambió antes del final')
    if f not in ('02-tecnologias.md', '03-base-de-datos.md'):
        cuerpo = b.split('## Enmiendas posteriores')[0]
        for ct in CT[f]:
            if not re.search(r'\*\*\[F7\]\*\*[^\n]*' + ct, cuerpo): fallos.append(f'E4 {f}: {ct} sin marca [F7] en el texto')
    if f == '05-frontend.md': a, b = sin_ct08(a), sin_ct08(b)
    if tablas(a) != tablas(b.split('\n---\n\n## Enmiendas posteriores')[0] if '## Enmiendas posteriores' not in a else b.split('## Enmiendas posteriores')[0]) and tablas(a.split('## Enmiendas posteriores')[0]) != tablas(b.split('## Enmiendas posteriores')[0]):
        fallos.append(f'E5 {f}: cambiaron las tablas')
ca = lambda t: re.findall(r'^- \*\*CA-\d+\.\d+.*$', t, re.M)
x, y = ca((O / '06-features.md').read_text(encoding='utf-8')), ca((E / '06-features.md').read_text(encoding='utf-8'))
if x != y or len(x) != 492: fallos.append(f'E6 CA de 06: {len(x)} → {len(y)}, iguales: {x == y}')
print(f'CA de 06: {len(y)} líneas, iguales al original: {x == y}')
print('RESULTADO:', 'PASA' if not fallos else 'FALLA\n  ' + '\n  '.join(fallos)); sys.exit(1 if fallos else 0)
