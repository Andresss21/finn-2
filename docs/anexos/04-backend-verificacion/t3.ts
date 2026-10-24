import { cliente, Prisma } from './comun.ts';
import pg from 'pg';
const db = cliente(3);
const RR = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 };
async function cargarPrisma() {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const [rev] = await tx.$queryRaw<any[]>`SELECT valor, finn.hoy()::text AS hoy FROM finn.revision WHERE id = 1`;
    const transacciones = await tx.transaccion.findMany({ select: { id: true, fecha: true, horaRegistro: true, claveOrden: true, total: true, comercio: true } });
    const lineas = await tx.linea.findMany({ select: { id: true, transaccionId: true, orden: true, monto: true } });
    const asignaciones = await tx.asignacion.findMany({ select: { id: true, categoriaId: true, periodoInicio: true, monto: true } });
    return { rev, transacciones, lineas, asignaciones };
  }, RR);
}
const res: number[] = [];
let bytes = 0;
for (let i = 0; i < 6; i++) {
  const t0 = performance.now(); const h = await cargarPrisma(); res.push(performance.now() - t0);
  bytes = JSON.stringify(h, (k, v) => typeof v === 'bigint' ? v.toString() : v).length;
}
console.log('Prisma findMany (ms):', res.map(x => Math.round(x)), 'JSON ≈', (bytes / 1e6).toFixed(1), 'MB');
const c = new pg.Client({ connectionString: 'postgresql://finn_app:a@127.0.0.1:5433/finn' }); await c.connect();
const r2: number[] = [];
for (let i = 0; i < 4; i++) {
  const t0 = performance.now();
  await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await c.query('SELECT id, fecha, hora_registro, clave_orden, total, comercio FROM finn.transacciones');
  await c.query('SELECT id, transaccion_id, orden, monto FROM finn.lineas');
  await c.query('SELECT id, categoria_id, periodo_inicio, monto FROM finn.asignaciones');
  await c.query('COMMIT'); r2.push(performance.now() - t0);
}
const sz = await c.query(`SELECT sum(pg_column_size(t.*)) FROM finn.transacciones t`);
console.log('pg directo (ms):', r2.map(Math.round), 'tamaño en disco filas transacciones ≈', (Number(sz.rows[0].sum)/1e6).toFixed(1), 'MB');
await c.end(); await db.$disconnect();
