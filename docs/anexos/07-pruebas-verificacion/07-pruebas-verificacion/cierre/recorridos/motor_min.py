"""Motor mínimo para calcular los números de los recorridos 4.3 y 4.6 de 06-features.md.

Implementa solo lo que esos recorridos usan de 01 §4: períodos del ciclo 21–20 (§4.2), saldos (§4.3),
actividad y reparto D2 sin devoluciones (§4.4, §4.5), Disponible, arrastre y cierre (§4.6), sobregiros
(§4.7), deuda sin respaldo (§4.8), LPA (§4.9), metas mensuales y para una fecha (§4.12), auto-asignar
(OP-17), "el promedio de gasto" de OP-16 con la precisión de CF-17, y comprueba la identidad de saldo
(inv. 1) en cada consulta. Montos en centavos enteros; nada en flotante.
No es el motor de la Fase 7: sirve para fijar los números esperados de un estado sembrado.
"""
from dataclasses import dataclass, field
from datetime import date, timedelta
from fractions import Fraction
import math

DIA_INICIO = 21


def inicio_periodo(f: date) -> date:
    if f.day >= DIA_INICIO:
        return date(f.year, f.month, DIA_INICIO)
    m, a = (f.month - 1, f.year) if f.month > 1 else (12, f.year - 1)
    return date(a, m, DIA_INICIO)


def siguiente(p: date) -> date:
    m, a = (p.month + 1, p.year) if p.month < 12 else (1, p.year + 1)
    return date(a, m, DIA_INICIO)


def fin(p: date) -> date:
    return siguiente(p) - timedelta(days=1)


def redondear(x: Fraction) -> int:
    return math.floor(Fraction(x) + Fraction(1, 2))


@dataclass
class Gasto:
    cuenta: str
    fecha: date
    clave: int                 # clave de orden (instante de registro, como entero creciente)
    lineas: list               # [(categoria, monto)]
    comercio: str = ''


@dataclass
class Meta:
    tipo: str                  # 'mensual' o 'fecha'
    monto: int
    modo: str = 'acumular'     # mensual: 'acumular' o 'rellenar'
    fo: date | None = None     # meta para una fecha


@dataclass
class Estado:
    hoy: date
    efectivo: dict = field(default_factory=dict)       # cuenta -> saldo inicial (entrada a LPA)
    tarjetas: dict = field(default_factory=dict)       # tarjeta -> saldo inicial (deuda, positivo)
    categorias: list = field(default_factory=list)     # [(grupo, categoria)] en orden; pago(t) aparte
    metas: dict = field(default_factory=dict)          # categoria -> Meta
    ingresos: list = field(default_factory=list)       # [(cuenta, fecha, monto)]
    gastos: list = field(default_factory=list)
    pagos: list = field(default_factory=list)          # [(origen, tarjeta, fecha, monto)]
    asig: dict = field(default_factory=dict)           # (categoria, inicio de período) -> monto
    devoluciones: list = field(default_factory=list)   # D-2: [(cuenta de efectivo, fecha, categoria, monto)]

    # ---------- derivados ----------
    def periodos(self):
        fechas = [f for _, f, *_ in self.devoluciones] + [f for _, f, _ in self.ingresos] + [g.fecha for g in self.gastos] + [p[2] for p in self.pagos] + \
                 [p for _, p in self.asig] + [self.hoy]
        p, ultimo = inicio_periodo(min(fechas)), max(inicio_periodo(self.hoy), max(p for _, p in self.asig) if self.asig else self.hoy)
        r = []
        while p <= ultimo:
            r.append(p); p = siguiente(p)
        return r

    @property
    def A(self):
        return inicio_periodo(self.hoy)

    def pago(self, t):
        return f'Pago {t}'

    def calcular(self):
        cats = [c for _, c in self.categorias]
        pagos_cat = [self.pago(t) for t in self.tarjetas]
        res = {}            # (c, p) -> dict
        arr = {c: 0 for c in cats + pagos_cat}
        for p in self.periodos():
            tr = {t: 0 for t in self.tarjetas}
            for c in cats:
                cons = []
                for g in self.gastos:
                    if inicio_periodo(g.fecha) != p: continue
                    for orden, (cc, m) in enumerate(g.lineas):
                        if cc == c:
                            cons.append((g.fecha, g.clave, orden, m, g.cuenta, g.comercio))
                cons.sort()
                ent = sum(x for _, f, cc, x in self.devoluciones if cc == c and inicio_periodo(f) == p)
                F = arr[c] + self.asig.get((c, p), 0) + ent
                rest, sobt, det = F, 0, []
                for f, k, o, m, cu, com in cons:
                    cub = max(0, min(m, rest)); nc = m - cub; rest -= cub
                    if cu in self.tarjetas:
                        tr[cu] += cub; sobt += nc
                    det.append(dict(fecha=f, comercio=com, cuenta=cu, monto=m, cubierto=cub, no_cubierto=nc))
                gastado = sum(x[3] for x in cons)
                disp = F - gastado
                cubierto = sum(x['cubierto'] for x in det)
                sob = max(0, -disp)
                res[(c, p)] = dict(asig=self.asig.get((c, p), 0), arr=arr[c], fondo=F, gastado=gastado - ent, consumido=gastado, disp=disp, cubierto=cubierto, ent=ent,
                                   sobt=sobt, sobd=sob - sobt, consumos=det, existia=bool(self.asig.get((c, p), 0)) or bool(cons) or bool(ent))
                arr[c] = max(0, disp)
            for t in self.tarjetas:
                c = self.pago(t)
                pag = sum(m for _, tt, f, m in self.pagos if tt == t and inicio_periodo(f) == p)
                disp = arr[c] + self.asig.get((c, p), 0) + tr[t] - pag
                res[(c, p)] = dict(asig=self.asig.get((c, p), 0), arr=arr[c], disp=disp, e=max(0, -disp), sobt=0, sobd=0)
                arr[c] = max(0, disp)
        return res

    def numeros(self):
        r = self.calcular(); A = self.A
        cats = [c for _, c in self.categorias]; pcs = [self.pago(t) for t in self.tarjetas]
        entradas = sum(self.efectivo.values()) + sum(m for _, f, m in self.ingresos if f <= self.hoy)
        sum_asig = sum(self.asig.values())
        reducciones = {}
        for p in self.periodos():
            if fin(p) < self.hoy:
                reducciones[p] = sum(r[(c, p)]['sobd'] for c in cats) + sum(r[(c, p)]['e'] for c in pcs)
        lpa = entradas - sum_asig - sum(reducciones.values())
        saldo_ef = sum(self.efectivo.values()) + sum(m for _, f, m in self.ingresos) \
            - sum(m for g in self.gastos if g.cuenta in self.efectivo for _, m in g.lineas) \
            - sum(m for o, _, _, m in self.pagos) + sum(x for *_, x in self.devoluciones)
        deuda = {t: self.tarjetas[t] + sum(m for g in self.gastos if g.cuenta == t for _, m in g.lineas)
                 - sum(m for _, tt, _, m in self.pagos if tt == t) for t in self.tarjetas}
        S = {t: max(0, deuda[t] - max(0, r[(self.pago(t), A)]['disp'])) for t in self.tarjetas}
        disp_A = {c: r[(c, A)]['disp'] for c in cats + pcs}
        fut = sum(m for (c, p), m in self.asig.items() if p > A)
        sobta = sum(r[(c, A)]['sobt'] for c in cats)
        assert saldo_ef == lpa + sum(disp_A.values()) + fut + sobta, 'identidad de saldo (inv. 1)'
        return dict(lpa=lpa, efectivo=saldo_ef, disp=disp_A, S=S, deuda=deuda, reducciones=reducciones,
                    sobta=sobta, fut=fut, r=r,
                    proyectada=sum(r[(c, A)]['sobd'] for c in cats) + sum(r[(c, A)]['e'] for c in pcs))

    # ---------- metas (01 §4.12) ----------
    def n(self, p, fo):
        if p > fo: return 1
        k, q = 1, p
        while fo > fin(q):
            q = siguiente(q); k += 1
        return k

    def meta(self, c, p=None):
        p = p or self.A; m = self.metas.get(c)
        if not m: return None
        r = self.calcular()[(c, p)]
        asig = r['asig']
        if m.tipo == 'mensual':
            pedido = m.monto if m.modo == 'acumular' else max(0, m.monto - r['arr'])
            falta = max(0, pedido - asig)
            return dict(pedido=pedido, falta=falta, estado='cubierta' if falta == 0 else 'con faltante')
        base = r['disp'] - asig
        disp_A = self.calcular()[(c, self.A)]['disp']
        if self.hoy > m.fo:
            disp_fo = self.calcular()[(c, inicio_periodo(m.fo))]['disp']
            if disp_fo >= m.monto or disp_A >= m.monto:
                return dict(pedido=0, falta=0, estado='completada')
            pedido = max(0, m.monto - base)
            return dict(pedido=pedido, falta=max(0, pedido - asig), estado='vencida')
        pedido = math.ceil(Fraction(max(0, m.monto - base), self.n(p, m.fo)))
        return dict(pedido=pedido, falta=max(0, pedido - asig),
                    estado='cumplida' if disp_A >= m.monto else 'en curso')

    # ---------- operaciones ----------
    def asignar(self, c, monto_nuevo, p=None):
        self.asig[(c, p or self.A)] = monto_nuevo

    def mover(self, o, d, x, p=None):
        p = p or self.A
        self.asig[(o, p)] = self.asig.get((o, p), 0) - x
        self.asig[(d, p)] = self.asig.get((d, p), 0) + x

    def auto_asignar(self, p=None):
        p = p or self.A; hecho, sin_cubrir = [], []
        for _, c in self.categorias:
            mt = self.meta(c, p)
            if not mt or mt['falta'] == 0: continue
            lpa = self.numeros()['lpa']
            x = min(mt['falta'], max(0, lpa))
            if x: self.asig[(c, p)] = self.asig.get((c, p), 0) + x; hecho.append((c, x))
            if x < mt['falta']: sin_cubrir.append((c, mt['falta'] - x))
        return hecho, sin_cubrir

    def promedio_gasto(self, c):
        """OP-16 con CF-17: últimos 3 cerrados en que existía c; los que haya; None con 0."""
        r = self.calcular()
        cerrados = [p for p in self.periodos() if fin(p) < self.hoy]
        usados = [p for p in reversed(cerrados) if r[(c, p)]['existia']][:3]
        if not usados: return None
        return redondear(Fraction(sum(r[(c, p)]['gastado'] for p in usados), len(usados))), len(usados)

    def historial(self, c, k=3):
        r = self.calcular()
        cerrados = [p for p in self.periodos() if fin(p) < self.hoy]
        usados = [p for p in reversed(cerrados) if r[(c, p)]['existia']][:k]
        return [(r[(c, p)]['asig'], r[(c, p)]['gastado']) for p in reversed(usados)]


def m(x):
    """'1,234.50' → centavos."""
    return int(round(Fraction(x.replace(',', '')) * 100))


def d(c):
    s = '−' if c < 0 else ''
    return f'{s}${abs(c) // 100:,}.{abs(c) % 100:02d}'
