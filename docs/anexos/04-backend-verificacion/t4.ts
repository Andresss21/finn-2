import { cliente, Prisma } from './comun.ts';
const db = cliente(3);
const RR = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 };
async function medir(nombre: string, f: (tx: any) => Promise<any>) {
  const t: number[] = []; let n = 0;
  for (let i = 0; i < 5; i++) { const t0 = performance.now(); const r = await db.$transaction(async (tx) => { await tx.$executeRaw`SET TRANSACTION READ ONLY`; return f(tx); }, RR); t.push(Math.round(performance.now() - t0)); n = r; }
  console.log(nombre, t, n);
}
await medir('queryRaw columnas', async (tx) => {
  const a = await tx.$queryRaw`SELECT id::text, fecha::text, hora_registro, clave_orden, total, comercio FROM finn.transacciones`;
  const b = await tx.$queryRaw`SELECT id::text, transaccion_id::text, orden, monto FROM finn.lineas`;
  const c = await tx.$queryRaw`SELECT id::text, categoria_id::text, periodo_inicio::text, monto FROM finn.asignaciones`;
  return a.length + b.length + c.length;
});
await medir('queryRaw json_agg compacto (arreglos)', async (tx) => {
  const [r] = await tx.$queryRaw`SELECT
    (SELECT json_agg(json_build_array(id, fecha, clave_orden, total, comercio)) FROM finn.transacciones)::text a,
    (SELECT json_agg(json_build_array(id, transaccion_id, orden, monto)) FROM finn.lineas)::text b,
    (SELECT json_agg(json_build_array(id, categoria_id, periodo_inicio, monto)) FROM finn.asignaciones)::text c`;
  const x = JSON.parse(r.a), y = JSON.parse(r.b), z = JSON.parse(r.c);
  return { filas: x.length + y.length + z.length, MB: ((r.a.length + r.b.length + r.c.length) / 1e6).toFixed(1) };
});
await db.$disconnect();
