"""V6-12: revisa las enmiendas de la Fase 6 aplicadas a 00, 01, 03, 04 y 05.

Uso: python3 enmiendas_f6.py <dir_originales> <dir_enmendados> [--negativo]

E1  Cada CF que 06 §7.5 da por aplicado en un documento aparece en ese documento enmendado (y no aparecía antes).
E2  Cada documento tiene una línea de la Fase 6 en "Enmiendas posteriores" (la última sección).
E3  00, 01 y 03 ("este documento no se modifica") solo cambian al final: el texto original es prefijo del enmendado.
E4  04 y 05: cada CF aplicado tiene al menos una marca [F6] en una sección distinta de la tabla de enmiendas y del encabezado.
E5  CF-03 (diferido) no agrega OP-54 ni `union_deudores` fuera de una línea que lo declara diferido; [R5] el campo descartado
    `deudasSobreActivosBp` de la propuesta de CF-25 no aparece (lo reemplazan las barras con escala relativa).
E6  Ninguna tabla markdown quedó con filas de distinta cantidad de columnas que su encabezado (comparado con el original).
"""
import re, sys, pathlib

APLICADOS = {
    '00-decisiones.md': ['CF-14'],
    '01-dominio.md': ['CF-01', 'CF-17', 'CF-20', 'CF-25'],
    '03-base-de-datos.md': ['CF-01', 'CF-14', 'CF-16', 'CF-20'],
    '04-backend.md': ['CF-01', 'CF-02', 'CF-04', 'CF-05', 'CF-06', 'CF-07', 'CF-09', 'CF-15', 'CF-16', 'CF-17',
                      'CF-18', 'CF-19', 'CF-20', 'CF-21', 'CF-22', 'CF-24', 'CF-25'],
    '05-frontend.md': ['CF-01', 'CF-02', 'CF-04', 'CF-05', 'CF-06', 'CF-07', 'CF-08', 'CF-10', 'CF-11', 'CF-12',
                       'CF-13', 'CF-15', 'CF-17', 'CF-18', 'CF-19', 'CF-21', 'CF-22', 'CF-23', 'CF-25'],
}
NO_MODIFICA = {'00-decisiones.md', '01-dominio.md', '03-base-de-datos.md'}


def celdas(fila):
    return len(re.findall(r'(?<!\\)\|', re.sub(r'`[^`]*`', '', fila)))


def tablas_malas(s):
    malas, enc, dentro = [], None, False
    for n, l in enumerate(s.splitlines(), 1):
        if l.startswith('|'):
            if not dentro:
                enc, dentro = celdas(l), True
            elif celdas(l) != enc and not re.match(r'^\|[-| :]+\|$', l):
                malas.append(l[:70])
        else:
            dentro = False
    return malas


def revisar(orig, enm):
    fallos = []
    for doc, cfs in APLICADOS.items():
        a, b = (orig / doc).read_text(), (enm / doc).read_text()
        for cf in cfs:
            if not re.search(re.escape(cf) + r'(?!\d)', b): fallos.append(f'E1 {doc}: falta {cf}')
        ultima = b.rsplit('## Enmiendas posteriores', 1)
        if len(ultima) < 2 or 'Fase 6' not in ultima[1]: fallos.append(f'E2 {doc}: sin línea de la Fase 6')
        if doc in NO_MODIFICA and not b.startswith(a.rstrip('\n')): fallos.append(f'E3 {doc}: cambió fuera de las enmiendas')
        if doc not in NO_MODIFICA:
            cuerpo = b
            for corte in ('#### 0.9.2 Enmiendas de la Fase 6', '### 0.13 Enmiendas de la Fase 6'):
                if corte in cuerpo:
                    i = cuerpo.index(corte); j = cuerpo.index('\n#', i + 5)
                    cuerpo = cuerpo[:i] + cuerpo[j:]
            cuerpo = cuerpo.split('## Enmiendas posteriores')[0]
            cuerpo = re.sub(r'\*\*Enmiendas de la Fase 6\*\*.*\n', '', cuerpo)
            marcas = [m for m in re.finditer(r'\[F6\]', cuerpo)]
            for cf in cfs:
                if not any(re.search(re.escape(cf) + r'(?!\d)', cuerpo[max(0, m.start() - 400): m.end() + 1500]) for m in marcas):
                    fallos.append(f'E4 {doc}: {cf} sin marca [F6] en su sección')
        def fuera_de_diferido(t, x):
            return sum(l.replace('*(CF-25)*', '').count(x) for l in t.splitlines() if 'diferid' not in l.lower() and 'pendiente' not in l.lower())
        for prohibido in ('OP-54', 'union_deudores', 'deudasSobreActivosBp'):
            if fuera_de_diferido(b, prohibido) > fuera_de_diferido(a, prohibido):
                fallos.append(f'E5 {doc}: agrega {prohibido} fuera de una línea de diferido o pendiente')
        nuevas = set(tablas_malas(b)) - set(tablas_malas(a))
        for t in nuevas: fallos.append(f'E6 {doc}: fila con columnas distintas: {t}')
    return fallos


if __name__ == '__main__':
    orig, enm = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    fallos = revisar(orig, enm)
    print('RESULTADO:', 'PASA' if not fallos else 'FALLA')
    for f in fallos: print('  -', f)
    if '--negativo' in sys.argv:
        import tempfile, shutil
        t = pathlib.Path(tempfile.mkdtemp())
        for d in APLICADOS: shutil.copy(enm / d, t / d)
        s = (t / '04-backend.md').read_text().replace('CF-22', 'CF-xx')
        (t / '04-backend.md').write_text(s)
        s = (t / '01-dominio.md').read_text().replace('## 0. Propósito', '## 0. Proposito', 1)
        (t / '01-dominio.md').write_text(s)
        s = (t / '05-frontend.md').read_text().replace('| `cuenta` **[F6]** CF-07 | `/cuentas/[cuentaId]` |', '| `cuenta` **[F6]** CF-07 | `/cuentas/[cuentaId]` | x |')
        (t / '05-frontend.md').write_text(s)
        neg = revisar(orig, t)
        esperados = {'E1 04-backend.md: falta CF-22', 'E3 01-dominio.md: cambió fuera de las enmiendas'}
        ok = esperados <= set(neg) and any(f.startswith('E6 05') for f in neg)
        print('Control negativo:', 'PASA' if ok else 'FALLA', [f for f in neg][:4])
