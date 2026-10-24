// Verificación de la corrección 1: la memoria de la instancia que escribe es idéntica a una carga nueva.
import { cliente, Prisma } from './comun.ts';
import { isDeepStrictEqual } from 'node:util';
const db = cliente(3);
const RR = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 };
const RC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 30000, maxWait: 5000 };
type Tx = { id: string; fecha: string; hora: string; clave: string; total: number; comercio: string | null; secuencia: string | null; revision: string | null };
type Li = { id: string; transaccionId: string; orden: number; monto: number; revision: string | null };
type Hechos = { transacciones: Map<string, Tx>; lineas: Map<string, Li> };
const INST = `to_char(date_trunc('milliseconds', clock_timestamp()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

async function cargar(tx: any): Promise<Hechos> {
  const [r] = await tx.$queryRawUnsafe(`SELECT
   (SELECT coalesce(json_agg(json_build_array(id, fecha,
      to_char(hora_registro AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      to_char(clave_orden AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      total, comercio, secuencia::text, revision::text)),'[]') FROM finn.transacciones)::text t,
   (SELECT coalesce(json_agg(json_build_array(id, transaccion_id, orden, monto, revision::text)),'[]') FROM finn.lineas)::text l`);
  const transacciones = new Map<string, Tx>(), lineas = new Map<string, Li>();
  for (const [id, fecha, hora, clave, total, comercio, secuencia, revision] of JSON.parse(r.t)) transacciones.set(id, { id, fecha, hora, clave, total, comercio, secuencia, revision });
  for (const [id, transaccionId, orden, monto, revision] of JSON.parse(r.l)) lineas.set(id, { id, transaccionId, orden, monto, revision });
  return { transacciones, lineas };
}
const leer = () => db.$transaction(async (tx) => { await tx.$executeRaw`SET TRANSACTION READ ONLY`;
  await tx.$executeRaw`SELECT set_config('TimeZone', 'UTC', true)`;
  const [b] = await tx.$queryRaw<any[]>`SELECT valor::text AS revision FROM finn.revision WHERE id = 1`;
  return { revision: b.revision, hechos: await cargar(tx) }; }, RR);

// "Dominio" simulado: puro; ids desde un generador inyectado; secuencia y revision desconocidas (null).
type Cambio = { tipo: 'insertar' | 'actualizar' | 'eliminar'; tabla: 'transacciones' | 'lineas'; fila?: any; id?: string; campos?: any };
function clonar(h: Hechos): Hechos { return { transacciones: new Map(h.transacciones), lineas: new Map(h.lineas) }; }

let memoria: { revision: string; hechos: Hechos } | null = null;

async function escribir(construir: (h: Hechos, inst: string, ids: () => string) => { cambios: Cambio[]; nuevos: Hechos }, usarReturning = true) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.$executeRaw`SELECT set_config('TimeZone', 'UTC', true)`;
    const [b] = await tx.$queryRawUnsafe<any[]>(`SELECT valor::text AS revision, ${INST} AS instante FROM finn.revision WHERE id = 1`);
    const hechos = memoria && memoria.revision === b.revision ? memoria.hechos : await cargar(tx);
    const { cambios, nuevos } = construir(hechos, b.instante, () => crypto.randomUUID());
    // Traductor reducido: F2 eliminar (hijos→padres), F3 insertar (padres→hijos), F4 actualizar
    for (const t of ['lineas', 'transacciones'] as const) for (const c of cambios.filter(c => c.tipo === 'eliminar' && c.tabla === t)) {
      await (t === 'lineas' ? tx.linea : tx.transaccion).delete({ where: { id: c.id! } });
    }
    const devueltos: { tabla: string; id: string; secuencia?: bigint; revision: bigint }[] = [];
    const ins = (t: string) => cambios.filter(c => c.tipo === 'insertar' && c.tabla === t).map(c => c.fila);
    if (ins('transacciones').length) {
      const r = await tx.transaccion.createManyAndReturn({ data: ins('transacciones').map((f: Tx) => ({ id: f.id, fecha: new Date(f.fecha + 'T00:00:00Z'), horaRegistro: new Date(f.hora), claveOrden: new Date(f.clave), total: f.total, comercio: f.comercio })), select: { id: true, secuencia: true, revision: true } });
      r.forEach(x => devueltos.push({ tabla: 'transacciones', ...x }));
    }
    if (ins('lineas').length) {
      const r = await tx.linea.createManyAndReturn({ data: ins('lineas').map((f: Li) => ({ id: f.id, transaccionId: f.transaccionId, orden: f.orden, monto: f.monto })), select: { id: true, revision: true } });
      r.forEach(x => devueltos.push({ tabla: 'lineas', ...x }));
    }
    for (const c of cambios.filter(c => c.tipo === 'actualizar')) {
      const r = await (c.tabla === 'lineas' ? tx.linea : tx.transaccion as any).update({ where: { id: c.id }, data: c.campos, select: { id: true, revision: true } });
      devueltos.push({ tabla: c.tabla, ...r });
    }
    const [f] = await tx.$queryRaw<any[]>`SELECT valor::text AS revision FROM finn.revision WHERE id = 1`;
    // (b) incorporar lo que fija la base
    if (usarReturning) for (const d of devueltos) {
      if (d.revision.toString() !== f.revision) throw new Error('revision devuelta distinta de la revision nueva');
      const mapa: Map<string, any> = (nuevos as any)[d.tabla];
      const fila = { ...mapa.get(d.id), revision: d.revision.toString() };
      if (d.secuencia !== undefined) fila.secuencia = d.secuencia.toString();
      mapa.set(d.id, fila);
    }
    return { revisionNueva: f.revision as string, nuevos };
  }, RC).then(r => { memoria = { revision: r.revisionNueva, hechos: r.nuevos }; return r; });
}

function comparar(nombre: string, a: Hechos, b: Hechos) {
  const iguales = isDeepStrictEqual(a, b);
  let dif = 0, ej: any = null;
  for (const t of ['transacciones', 'lineas'] as const) for (const [id, fa] of (a as any)[t]) { const fb = (b as any)[t].get(id); if (!isDeepStrictEqual(fa, fb)) { dif++; ej ??= { tabla: t, memoria: fa, base: fb }; } }
  for (const t of ['transacciones', 'lineas'] as const) for (const id of (b as any)[t].keys()) if (!(a as any)[t].has(id)) { dif++; ej ??= { tabla: t, soloEnBase: id }; }
  console.log(`${nombre}: ${iguales ? 'IDÉNTICA' : 'DIFIERE'} (filas: ${a.transacciones.size} tx, ${a.lineas.size} líneas; diferencias: ${dif})`, ej ? JSON.stringify(ej) : '');
}

// Operación 1: insertar una transacción con tres líneas (id principal enviado por el cliente)
const inicial = await leer(); memoria = inicial;
const idCliente = crypto.randomUUID();
const op1 = (h: Hechos, inst: string, ids: () => string) => {
  const n = clonar(h);
  const t: Tx = { id: idCliente, fecha: '2026-10-12', hora: inst, clave: inst, total: 600, comercio: 'Super', secuencia: null, revision: null };
  const ls: Li[] = [100, 200, 300].map((m, i) => ({ id: ids(), transaccionId: idCliente, orden: i + 1, monto: m, revision: null }));
  n.transacciones.set(t.id, t); ls.forEach(l => n.lineas.set(l.id, l));
  return { cambios: [{ tipo: 'insertar', tabla: 'transacciones', fila: t }, ...ls.map(l => ({ tipo: 'insertar' as const, tabla: 'lineas' as const, fila: l }))], nuevos: n };
};
await escribir(op1);
comparar('Op1 (alta con 3 líneas) memoria vs carga nueva', memoria!.hechos, (await leer()).hechos);

// Operación 2: editar total, actualizar una línea, eliminar otra (BE-16: sin tocar orden) e insertar una nueva
const op2 = (h: Hechos, _inst: string, ids: () => string) => {
  const n = clonar(h);
  const ls = [...n.lineas.values()].filter(l => l.transaccionId === idCliente).sort((a, b) => a.orden - b.orden);
  const nueva: Li = { id: ids(), transaccionId: idCliente, orden: 4, monto: 250, revision: null };
  n.transacciones.set(idCliente, { ...n.transacciones.get(idCliente)!, total: 650 });
  n.lineas.set(ls[0].id, { ...ls[0], monto: 100 + 50 }); n.lineas.delete(ls[2].id); n.lineas.set(nueva.id, nueva);
  // 150 + 200 + 250 = 600? ajustar: total 600
  n.transacciones.set(idCliente, { ...n.transacciones.get(idCliente)!, total: 600 });
  return { cambios: [
    { tipo: 'eliminar', tabla: 'lineas', id: ls[2].id },
    { tipo: 'insertar', tabla: 'lineas', fila: nueva },
    { tipo: 'actualizar', tabla: 'lineas', id: ls[0].id, campos: { monto: 150 } },
    { tipo: 'actualizar', tabla: 'transacciones', id: idCliente, campos: { total: 600 } },
  ] as Cambio[], nuevos: n };
};
await escribir(op2);
comparar('Op2 (edición: actualizar, eliminar e insertar líneas) memoria vs carga nueva', memoria!.hechos, (await leer()).hechos);

// Control negativo: sin incorporar RETURNING
const idCliente2 = crypto.randomUUID();
await escribir((h, inst, ids) => { const n = clonar(h); const t: Tx = { id: idCliente2, fecha: '2026-10-12', hora: inst, clave: inst, total: 10, comercio: null, secuencia: null, revision: null };
  const l: Li = { id: ids(), transaccionId: idCliente2, orden: 1, monto: 10, revision: null }; n.transacciones.set(t.id, t); n.lineas.set(l.id, l);
  return { cambios: [{ tipo: 'insertar', tabla: 'transacciones', fila: t }, { tipo: 'insertar', tabla: 'lineas', fila: l }], nuevos: n }; }, false);
comparar('Control negativo (sin RETURNING)', memoria!.hechos, (await leer()).hechos);
await db.$disconnect();
