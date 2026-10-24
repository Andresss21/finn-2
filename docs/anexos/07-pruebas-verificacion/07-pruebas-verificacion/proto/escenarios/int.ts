// Ejecutor `int` de los escenarios (prototipo de V7-08): cada operación se escribe con el protocolo de 04 §4.2 (bloqueo,
// zona UTC, `finn.hoy` y desfase simulados) como `finn_app`, contra el esquema real de 03; después se cargan los hechos
// desde la base y se calcula con el mismo núcleo. En la Fase 8, la escritura es la operación de @finn/aplicacion y la
// lectura es la consulta; aquí, SQL directo con las mismas tablas.
import pg from 'pg';
import { crearBase } from '../int/base';
import { inicio, type Hechos } from '../dominio/nucleo';
import { observar } from './motor';
import { PERIODOS, usd, type Escenario, type Op, type Paso } from './tipos';
interface S { base: Awaited<ReturnType<typeof crearBase>>; c: pg.Client; hoy: string; reloj: number; refs: Map<string, string>; corte: Record<string, number> }
const local = (s: string) => s + ':00-06:00';
async function escribir<T>(c: pg.Client, hoy: string, instanteLocal: string, f: () => Promise<T>) {
  await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  try {
    await c.query('SELECT finn.tomar_bloqueo()');
    await c.query(`SELECT set_config('TimeZone','UTC',true)`);
    // un solo desfase por transacción: finn.instante() ≈ el instante local pedido (simulado = real + desfase)
    await c.query(`SELECT set_config('finn.hoy',$1,true), set_config('finn.desfase_ms', (round(extract(epoch FROM ($2::timestamptz - clock_timestamp()))*1000))::bigint::text, true)`, [hoy, local(instanteLocal)]);
    const r = await f(); await c.query('COMMIT'); return r;
  } catch (e) { await c.query('ROLLBACK'); throw e; }
}
const id = async (c: pg.Client, sql: string, p: unknown[] = []) => (await c.query(sql, p)).rows[0]?.id as string;
const cuenta = (c: pg.Client, n: string) => id(c, `SELECT id FROM finn.cuentas WHERE nombre=$1`, [n]);
const categoria = (c: pg.Client, n: string) => id(c, `SELECT id FROM finn.categorias WHERE nombre=$1`, [n]);
function instanteDe(s: S, op: { registrado?: string }) { s.reloj++; if (op.registrado) return { hoy: op.registrado.slice(0, 10), t: op.registrado };
  const m = 12 * 60 + s.reloj; return { hoy: s.hoy, t: `${s.hoy}T${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }; }
async function tx(c: pg.Client, tipo: string, fecha: string, total: number, efectos: [string, number][], lineas: string[]) {
  // un instante por operación (V7-01): hora_registro = clave_orden = finn.instante() tomado una vez
  const t = await id(c, `WITH i AS (SELECT finn.instante() t) INSERT INTO finn.transacciones (tipo, fecha, hora_registro, clave_orden, origen, estado_bancario, total)
    SELECT $1, $2, i.t, i.t, 'manual', 'pendiente', $3 FROM i RETURNING id`, [tipo, fecha, total]);
  for (const [cta, m] of efectos) await c.query(`INSERT INTO finn.efectos (transaccion_id, cuenta_id, monto) VALUES ($1,$2,$3)`, [t, cta, m]);
  let o = 1; for (const l of lineas) { const [cat, m] = JSON.parse(l); await c.query(`INSERT INTO finn.lineas (transaccion_id, orden, monto, categoria_id) VALUES ($1,$2,$3,$4)`, [t, o++, m, cat]); }
  return t;
}
async function aplicar(s: S, op: Op) {
  const c = s.c;
  switch (op.op) {
    case 'ingreso': { const { hoy, t } = instanteDe(s, op); return escribir(c, hoy, t, async () => tx(c, 'ingreso', op.fecha ?? s.hoy, usd(op.monto), [[await cuenta(c, 'Ahorro'), usd(op.monto)]], [])); }
    case 'asignar': { const { hoy, t } = instanteDe(s, {}); const p = op.periodo ? PERIODOS[op.periodo] : inicio(s.hoy);
      return escribir(c, hoy, t, async () => { const cat = await categoria(c, op.categoria);
        const r = await c.query(`INSERT INTO finn.asignaciones (categoria_id, periodo_inicio, monto) VALUES ($1,$2,$3)
          ON CONFLICT (categoria_id, periodo_inicio) DO UPDATE SET monto = finn.asignaciones.monto + EXCLUDED.monto RETURNING monto`, [cat, p, usd(op.monto)]).catch(async e => {
            if (e.code !== '23514') throw e; return null; });
        if (r === null || r.rows[0]?.monto === 0) await c.query(`DELETE FROM finn.asignaciones WHERE categoria_id=$1 AND periodo_inicio=$2`, [cat, p]); }); }
    case 'compra': { const { hoy, t } = instanteDe(s, op); const total = op.lineas.reduce((a, l) => a + usd(l[1]), 0);
      const ref = await escribir(c, hoy, t, async () => tx(c, 'gasto', op.fecha ?? s.hoy, total, [[await cuenta(c, op.cuenta), -total]],
        await Promise.all(op.lineas.map(async ([n, m]) => JSON.stringify([await categoria(c, n), usd(m)])))));
      s.refs.set(op.ref, ref); return; }
    case 'pagar': { const { hoy, t } = instanteDe(s, op); const P = usd(op.monto);
      return escribir(c, hoy, t, async () => tx(c, 'pago_tarjeta', op.fecha ?? s.hoy, P, [[await cuenta(c, 'Ahorro'), -P], [await cuenta(c, op.tarjeta), P]],
        [JSON.stringify([await categoria(c, 'Pago ' + op.tarjeta), P])])); }
    case 'cambiarCuenta': { const { hoy, t } = instanteDe(s, {});
      return escribir(c, hoy, t, async () => { await c.query(`UPDATE finn.efectos SET cuenta_id=$2 WHERE transaccion_id=$1`, [s.refs.get(op.ref), await cuenta(c, op.cuenta)]); }); }
  }
}
// Lectura: los hechos de la base en la forma del núcleo (en la Fase 8, `cargarHechos` de @finn/db).
async function cargar(s: S): Promise<Hechos> {
  const q = async (sql: string) => (await s.c.query(sql)).rows;
  const ctas = await q(`SELECT id, nombre, tipo FROM finn.cuentas`);
  const nombre = (i: string) => ctas.find(x => x.id === i)!.nombre;
  const ef = ctas.filter(x => x.tipo === 'efectivo'), tj = ctas.filter(x => x.tipo === 'tarjeta');
  const si = await q(`SELECT e.cuenta_id, e.monto FROM finn.transacciones t JOIN finn.efectos e ON e.transaccion_id=t.id WHERE t.tipo='saldo_inicial'`);
  const txs = await q(`SELECT t.id, t.tipo, to_char(t.fecha,'YYYY-MM-DD') fecha, t.total, (extract(epoch FROM t.clave_orden)*1000000)::bigint AS clave, t.secuencia,
      json_agg(json_build_object('cuenta', e.cuenta_id, 'monto', e.monto)) AS efectos FROM finn.transacciones t JOIN finn.efectos e ON e.transaccion_id=t.id GROUP BY t.id`);
  const lin = await q(`SELECT l.transaccion_id, c.nombre, l.monto FROM finn.lineas l JOIN finn.categorias c ON c.id=l.categoria_id ORDER BY l.transaccion_id, l.orden`);
  const asig = await q(`SELECT c.nombre, to_char(a.periodo_inicio,'YYYY-MM-DD') p, a.monto FROM finn.asignaciones a JOIN finn.categorias c ON c.id=a.categoria_id`);
  const cats = (await q(`SELECT nombre FROM finn.categorias WHERE clase='normal' ORDER BY orden, nombre`)).map(r => r.nombre);
  const h: Hechos = { hoy: s.hoy, efectivo: Object.fromEntries(ef.map(x => [x.nombre, si.filter(y => y.cuenta_id === x.id).reduce((a, y) => a + y.monto, 0)])),
    tarjetas: Object.fromEntries(tj.map(x => [x.nombre, -si.filter(y => y.cuenta_id === x.id).reduce((a, y) => a + y.monto, 0)])), categorias: cats,
    ingresos: [], gastos: [], pagos: [], asig: asig.map(a => [a.nombre, a.p, a.monto]), devoluciones: [] };
  for (const t of txs) {
    if (t.tipo === 'ingreso') h.ingresos.push([nombre(t.efectos[0].cuenta), t.fecha, t.total]);
    if (t.tipo === 'gasto') h.gastos.push({ id: String(t.secuencia).padStart(12, '0'), cuenta: nombre(t.efectos[0].cuenta), fecha: t.fecha, clave: process.env.INT_MUTANTE === 'clave' ? 0 : Number(t.clave),
      lineas: lin.filter(l => l.transaccion_id === t.id).map(l => [l.nombre, l.monto]) });
    if (t.tipo === 'pago_tarjeta') { const o = t.efectos.find((e: any) => e.monto < 0), d = t.efectos.find((e: any) => e.monto > 0);
      h.pagos.push([nombre(o.cuenta), nombre(d.cuenta), t.fecha, t.total]); }
  }
  return h;
}
async function nuevaBase(e: Escenario, hoy: string, plantilla?: string): Promise<S> {
  const base = await crearBase(plantilla); const c = await base.conectar();
  return { base, c, hoy, reloj: 0, refs: new Map(), corte: Object.fromEntries((e.cuentas?.tarjetas ?? []).map(t => [t.nombre, t.diaCorte ?? 15])) };
}
export const ejecutorInt = {
  nombre: 'int' as const,
  async iniciar(e: Escenario, hoy: string) {
    const s = await nuevaBase(e, hoy);
    // Siembra de la convención de 01 §8.0: ciclo 21 (datos iniciales de 03 §9), Ahorro, tarjetas con su categoría de pago, categorías
    await escribir(s.c, hoy, `${hoy}T07:00`, async () => {
      const g = await id(s.c, `INSERT INTO finn.grupos (nombre, orden) VALUES ('Gastos', 1) RETURNING id`);
      let o = 0; for (const n of e.categorias ?? []) await s.c.query(`INSERT INTO finn.categorias (grupo_id, nombre, orden) VALUES ($1,$2,$3)`, [g, n, ++o]);
      for (const n of e.cuentas?.efectivo ?? ['Ahorro']) await s.c.query(`INSERT INTO finn.cuentas (tipo, nombre, fecha_apertura) VALUES ('efectivo',$1,'2027-01-21')`, [n]);
      const gp = await id(s.c, `SELECT id FROM finn.grupos WHERE clave_sistema='pagos_tarjeta'`);
      for (const t of e.cuentas?.tarjetas ?? []) {
        const k = await id(s.c, `INSERT INTO finn.cuentas (tipo, nombre, fecha_apertura) VALUES ('tarjeta',$1,'2027-01-21') RETURNING id`, [t.nombre]);
        await s.c.query(`INSERT INTO finn.tarjetas (cuenta_id, limite_credito, dia_corte, dia_pago) VALUES ($1, 500000, $2, 5)`, [k, t.diaCorte ?? 15]);
        await s.c.query(`INSERT INTO finn.categorias (grupo_id, nombre, clase, tarjeta_id) VALUES ($1,$2,'pago',$3)`, [gp, 'Pago ' + t.nombre, k]);
      }
    });
    (s as any).esc = e; return s;
  },
  async bifurcar(s: S): Promise<S> {
    await s.c.end();                                        // CREATE DATABASE … TEMPLATE exige que nadie esté conectado a la fuente
    const r = await nuevaBase((s as any).esc, s.hoy, s.base.nombre);
    s.c = await s.base.conectar();
    return Object.assign(r, { hoy: s.hoy, reloj: s.reloj + 1000, refs: new Map(s.refs), esc: (s as any).esc });
  },
  async paso(s: S, p: Paso) {
    if (p.hoy) s.hoy = p.hoy;
    for (const op of p.ops) await aplicar(s, op);
    const o = observar({ hechos: await cargar(s), refs: s.refs, reloj: 0, cortes: s.corte }, [], {});
    o.omitidos.push('avisos-operacion', 'desglose');      // los devuelve la operación (Fase 8), no la lectura
    return o;
  },
  async terminar(s: S) { await s.c.end().catch(() => {}); await s.base.destruir(); },
};
