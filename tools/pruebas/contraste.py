"""V5-23 (05 §10.2, 06-identidad-visual §1): contraste WCAG 2.2 de los tokens de color en los dos temas.
Portado de `prototipos/tokens.py` de 05-frontend-verificacion-D (CH-09), pero lee `tokens.json` de la entrega
del diseño en vez de generar los tokens. Uso: python contraste.py [ruta/a/tokens.json]. Sale con 1 si algún par falla."""
import json
import sys

RUTA = 'apps/web/src/app/tokens.json'
TEMAS = ('claro', 'oscuro')
ESTADOS = ['positivo', 'cero', 'advertencia', 'problema', 'deuda', 'deuda-sin-respaldo', 'informacion']
SUPERFICIES = ['fondo', 'superficie', 'superficie-elevada', 'superficie-hundida']
TRES = ['fondo', 'superficie', 'superficie-elevada']


def luminancia(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contraste(a, b):
    la, lb = sorted([luminancia(a), luminancia(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def pares():
    """(frente, fondo, mínimo). El texto deshabilitado y lo decorativo están exentos (06-identidad-visual §1)."""
    r = []
    for t in ['texto', 'texto-secundario', 'texto-terciario', 'enlace']:
        r += [(t, s, 4.5) for s in SUPERFICIES]
    r += [('texto-sobre-accion', s, 4.5) for s in ['accion', 'accion-hover', 'accion-presionada']]
    r += [('texto', 'accion-secundaria', 4.5), ('texto-sobre-peligro', 'peligro', 4.5)]
    r += [('borde-control', s, 3.0) for s in ['fondo', 'superficie', 'superficie-hundida']]
    for s in TRES:
        r += [('foco', s, 3.0), ('accion', s, 3.0), ('peligro', s, 3.0)]
    for e in ESTADOS:
        r += [(f'{e}-texto', s, 4.5) for s in [f'{e}-fondo', *TRES]]
        r += [(f'{e}-borde', s, 3.0) for s in [f'{e}-fondo', 'superficie', 'fondo']]
    for i in range(1, 9):
        r += [(f'grafico-serie-{i}', s, 3.0) for s in TRES]
    for g in ['grafico-referencia', 'grafico-tinta', 'grafico-otras']:
        r += [(g, s, 3.0) for s in TRES]
    r += [('texto-sobre-marca', 'marca', 4.5), ('marca', 'fondo', 3.0), ('marca', 'superficie', 3.0)]
    r += [('accion', 'accion-tonal', 4.5), ('marca-icono-figura', 'marca-icono-fondo', 3.0)]
    r += [('texto-secundario', f'cuenta-{c}', 4.5) for c in ['banco', 'ahorro', 'prestamo', 'inversion']]
    r += [('advertencia-texto', 'cuenta-banco', 4.5)]
    return r


def principal(ruta):
    color = json.load(open(ruta, encoding='utf-8'))['color']
    fallos = 0
    total = 0
    for tema in TEMAS:
        for frente, fondo, minimo in pares():
            c = contraste(color[frente][tema], color[fondo][tema])
            total += 1
            if c < minimo:
                fallos += 1
                print(f'FALLA {tema}: {frente} sobre {fondo} = {c:.2f} < {minimo}')
    print(f'V5-23: {total} pares verificados, {fallos} fallos')
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.exit(principal(sys.argv[1] if len(sys.argv) > 1 else RUTA))
