"""Prototipo de las fórmulas [Propio] de 06-features §3.4 (F6-4) y §3.2 (F6-2).
Montos en centavos enteros. Redondeo: mitad hacia arriba (half-up) salvo que se diga.
No reimplementa el motor: recibe como entrada los derivados de 01 §4 (Disp, fondo,
Gastado, SobT, SobD, S, E) que el selector real tomaría de la instantánea."""
from dataclasses import dataclass, field
from fractions import Fraction
from statistics import median_low

# ---- Umbrales (módulo único, FD-17) --------------------------------------
DIAS_MIN_RITMO = 7
CONSUMOS_MIN_RITMO = 3
EXCESO_MIN = 500            # $5.00
EXCESO_MIN_PCT = Fraction(5, 100)
REAL_TOL_MIN = 1000         # $10.00
REAL_TOL_PCT = Fraction(10, 100)
PROM_VAR_PCT = Fraction(25, 100)
PROM_VAR_MIN = 2000         # $20.00
HORMIGA_MONTO_MAX = 1000    # $10.00 por compra
HORMIGA_CANT_MIN = 5
HORMIGA_TOTAL_MIN = 2000    # $20.00
SUSC_PERIODOS_MIN = 3       # de los últimos 4 cerrados
SUSC_MONTO_PCT = Fraction(10, 100)
SUSC_DIAS = 5
HALLAZGOS_MAX = 5
RITMO_INICIO_MAX = 3


def redondear(x: Fraction) -> int:
    """Mitad hacia arriba al centavo (para x >= 0 y x < 0 simétrico hacia +inf en .5)."""
    x = Fraction(x)
    return int((x + Fraction(1, 2)).__floor__())


def repartir(total: int, pesos: dict) -> dict:
    """Reparto proporcional por resto mayor: cada parte es la proporcional truncada y los
    centavos que faltan van a los restos mayores (empate: nombre del medio). La suma es exacta
    y ninguna parte es negativa."""
    suma = sum(pesos.values())
    if total == 0 or suma == 0:
        return {}
    base = {m: (total * w) // suma for m, w in pesos.items()}
    falta = total - sum(base.values())
    orden = sorted(pesos, key=lambda m: (-((total * pesos[m]) % suma), m))
    for m in orden[:falta]:
        base[m] += 1
    return {m: v for m, v in base.items() if v}


@dataclass
class Consumo:
    fecha: int            # día dentro del período (1..dur)
    monto: int            # neto, centavos
    medio: str            # 'debito' o id de tarjeta
    programada: bool = False   # resolvió una ocurrencia esperada


@dataclass
class Cat:
    nombre: str
    disp: int             # Disp(c, A)
    fondo: int            # F(c, A)
    sob_t: dict = field(default_factory=dict)   # SobT(c,A) por tarjeta
    sob_d: int = 0        # SobD(c,A)
    consumos: list = field(default_factory=list)
    prog_pend: list = field(default_factory=list)  # (monto, medio) de ocurrencias pendientes <= fin(A)
    meta_ahorro: bool = False


def ritmo(c: Cat, dias_trans: int, dias_rest: int):
    """Devuelve dict con disp_proy, exceso, futuro por medio, evaluable."""
    variables = [k for k in c.consumos if not k.programada]
    gv = sum(k.monto for k in variables)
    evaluable = dias_trans >= DIAS_MIN_RITMO and len(variables) >= CONSUMOS_MIN_RITMO
    proy_var = redondear(Fraction(gv * dias_rest, dias_trans)) if evaluable else 0
    pend = sum(m for m, _ in c.prog_pend)
    disp_proy = c.disp - proy_var - pend
    exceso = max(0, -disp_proy)
    # futuro por medio: variable repartido por peso de cada medio; programadas exactas
    futuro = {}
    if proy_var:
        pesos = {}
        for k in variables:
            pesos[k.medio] = pesos.get(k.medio, 0) + k.monto
        futuro = repartir(proy_var, pesos)
    for m, medio in c.prog_pend:
        futuro[medio] = futuro.get(medio, 0) + m
    return dict(evaluable=evaluable, proy_var=proy_var, pend=pend,
                disp_proy=disp_proy, exceso=exceso, futuro=futuro, gv=gv)


def hallazgo_ritmo(c: Cat, r: dict):
    umbral = max(EXCESO_MIN, redondear(EXCESO_MIN_PCT * max(0, c.fondo)))
    return r['evaluable'] and r['exceso'] >= umbral and r['exceso'] > 0


def proyeccion_cierre(cats, dias_trans, dias_rest, S, E):
    """S: te falta reservar actual por tarjeta; E: pago excedente actual por tarjeta."""
    sobd_total, falta = 0, dict(S)
    sobregiradas, sobrante = [], 0
    for c in cats:
        r = ritmo(c, dias_trans, dias_rest)
        actual = c.sob_d + sum(c.sob_t.values())
        adicional = r['exceso'] - actual
        assert adicional >= 0, (c.nombre, r, actual)
        tot_fut = sum(r['futuro'].values())
        partes = repartir(adicional, r['futuro']) if adicional else {}
        sobd = c.sob_d + partes.get('debito', 0)
        sobd_total += sobd
        for t, v in partes.items():
            if t != 'debito':
                falta[t] = falta.get(t, 0) + v
        for t, v in c.sob_t.items():
            pass  # ya incluidas en S(t)
        if r['disp_proy'] < 0:
            sobregiradas.append(c.nombre)
        else:
            sobrante += r['disp_proy']
        assert sum(partes.values()) == adicional
    return dict(sobregiradas=sobregiradas,
                reduccion=sobd_total + sum(E.values()),
                falta=falta, sobrante=sobrante)


def realidad(hist, asig_actual):
    """hist: [(asig, gastado)] de los 3 últimos cerrados. Devuelve (direccion, sugerido) o None."""
    if len(hist) < 3:
        return None
    tol = lambda a: max(REAL_TOL_MIN, redondear(REAL_TOL_PCT * abs(a)))
    sobre = all(g > a + tol(a) for a, g in hist)
    bajo = all(g < a - tol(a) and g > 0 for a, g in hist)
    if not (sobre or bajo):
        return None
    prom = redondear(Fraction(sum(g for _, g in hist), 3))
    sugerido = redondear(Fraction(prom, 100)) * 100
    if sugerido == asig_actual:
        return None
    return ('se_pasa' if sobre else 'sobra', prom, sugerido)


def comparacion_promedio(gasto, previos):
    if len(previos) < 3:
        return None
    prom = redondear(Fraction(sum(previos), 3))
    if prom <= 0:
        return None
    d = gasto - prom
    if abs(d) >= PROM_VAR_MIN and Fraction(abs(d), prom) >= PROM_VAR_PCT:
        return (d, prom, redondear(Fraction(d * 10000, prom)))  # puntos básicos
    return None


def hormiga(transacciones):
    """[R1] transacciones: [(clave_comercio, total, programada, lineas)] del período, con
    lineas = [(categoria, monto)] (líneas de categoría). Agrupa por comercio y por categoría.
    Devuelve los grupos que pasan los umbrales, ya sin solapamientos: si un grupo de comercio y
    uno de categoría comparten al menos una compra, queda el de mayor impacto (total);
    a igual total, el de categoría."""
    peq = [(i, t) for i, t in enumerate(transacciones) if t[1] <= HORMIGA_MONTO_MAX and not t[2]]
    grupos = {}
    for i, (clave, total, _, lineas) in peq:
        g = grupos.setdefault(('comercio', clave), [0, 0, set()])
        g[0] += 1; g[1] += total; g[2].add(i)
        for cat, monto in lineas:
            g = grupos.setdefault(('categoria', cat), [0, 0, set()])
            if i not in g[2]:
                g[0] += 1
            g[1] += monto; g[2].add(i)
    pasan = {k: v for k, v in grupos.items() if v[0] >= HORMIGA_CANT_MIN and v[1] >= HORMIGA_TOTAL_MIN}
    orden = sorted(pasan, key=lambda k: (-pasan[k][1], 0 if k[0] == 'categoria' else 1, k[1]))
    elegidos = []
    for k in orden:
        if all(not (pasan[k][2] & pasan[e][2]) for e in elegidos):
            elegidos.append(k)
    return {k: pasan[k][:2] for k in elegidos}


def suscripcion(por_periodo):
    """por_periodo: lista de 4 períodos cerrados (más antiguo primero), cada uno lista de (dia_mes, total)."""
    todos = [x for p in por_periodo for x in p]
    if not todos:
        return None
    med = median_low([t for _, t in todos])
    dmed = median_low([d for d, _ in todos])
    ok = 0
    for p in por_periodo:
        if any(abs(t - med) <= redondear(SUSC_MONTO_PCT * med) and abs(d - dmed) <= SUSC_DIAS for d, t in p):
            ok += 1
    if ok >= SUSC_PERIODOS_MIN:
        return dict(mensual=med, anual=12 * med)
    return None


def ordenar_hallazgos(hs):
    """hs: [(impacto, orden_tipo, categoria, texto)]; una por categoría, la de más impacto."""
    mejor = {}
    for h in hs:
        k = h[2]
        if k not in mejor or (h[0], -h[1]) > (mejor[k][0], -mejor[k][1]):
            mejor[k] = h
    return sorted(mejor.values(), key=lambda h: (-h[0], h[1], h[2]))[:HALLAZGOS_MAX]


def moneda(c):
    s = '−' if c < 0 else ''
    c = abs(c)
    return f"{s}${c // 100:,}.{c % 100:02d}"
