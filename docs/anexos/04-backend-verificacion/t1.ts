import { cliente, describir, Prisma } from './comun.ts';
const db = cliente();
const R = (n: string, x: any) => console.log(`\n### ${n}\n`, JSON.stringify(x, (k, v) => typeof v === 'bigint' ? v.toString() : v, 1));
const ESC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 20000, maxWait: 5000 };

// T1: escritura sin bloqueo -> FN001
try {
  await db.$transaction(async (tx) => {
    await tx.asignacion.create({ data: { categoriaId: crypto.randomUUID(), periodoInicio: new Date('2026-09-21'), monto: 100 } });
  }, ESC);
  R('T1', 'NO FALLÓ');
} catch (e) { R('T1 sin bloqueo', describir(e)); }

// T2: con bloqueo; primera consulta revisión+hoy+ahora; varias sentencias => revisión +1
const antes = await db.revision.findUnique({ where: { id: 1 } });
const r2 = await db.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
  const [ini] = await tx.$queryRaw<any[]>`SELECT valor, finn.hoy()::text AS hoy, now() AS ahora FROM finn.revision WHERE id = 1`;
  const t = await tx.transaccion.create({ data: { fecha: new Date('2026-10-10T00:00:00Z'), horaRegistro: ini.ahora, claveOrden: ini.ahora, total: 300,
    lineas: { create: [{ orden: 1, monto: 100 }, { orden: 2, monto: 200 }] } } });
  await tx.asignacion.create({ data: { categoriaId: crypto.randomUUID(), periodoInicio: new Date('2026-09-21'), monto: 50 } });
  const [fin] = await tx.$queryRaw<any[]>`SELECT valor FROM finn.revision WHERE id = 1`;
  return { ini, fin, t };
}, ESC);
R('T2 con bloqueo', { antes: antes?.valor, inicio: r2.ini, fin: r2.fin.valor, revFila: r2.t.revision, fechaDevuelta: r2.t.fecha });

// T3: diferida FN003 al confirmar
try {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.transaccion.create({ data: { fecha: new Date('2026-10-10'), horaRegistro: new Date(), claveOrden: new Date(), total: 300,
      lineas: { create: [{ orden: 1, monto: 100 }] } } });
  }, ESC);
  R('T3', 'NO FALLÓ');
} catch (e) { R('T3 diferida al COMMIT', describir(e)); }

// T4: inmediata FN002 y efecto de set_config('finn.operacion', ..., true)
try {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.asignacion.create({ data: { categoriaId: crypto.randomUUID(), periodoInicio: new Date('2026-08-21'), monto: 10 } });
  }, ESC);
} catch (e) { R('T4a inmediata FN002', describir(e)); }
await db.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
  await tx.$executeRaw`SELECT set_config('finn.operacion', 'fusion', true)`;
  await tx.asignacion.create({ data: { categoriaId: crypto.randomUUID(), periodoInicio: new Date('2026-08-21'), monto: 10 } });
}, ESC);
const fugas = await Promise.all([1,2,3,4,5,6].map(() => db.$transaction(async (tx) => (await tx.$queryRaw<any[]>`SELECT current_setting('finn.operacion', true) AS op`)[0].op)));
R('T4b fusion con set_config local; operacion() en transacciones siguientes del pool', fugas);

// T5: 23505 con id del cliente
const id = crypto.randomUUID();
const crear = () => db.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
  await tx.transaccion.create({ data: { id, fecha: new Date('2026-10-10'), horaRegistro: new Date(), claveOrden: new Date(), total: 5, lineas: { create: [{ orden: 1, monto: 5 }] } } });
}, ESC);
await crear();
try { await crear(); } catch (e) { R('T5 23505 por id del cliente', describir(e)); }

// T6: lectura REPEATABLE READ + SET TRANSACTION READ ONLY; intento de escritura
try {
  const r = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const [x] = await tx.$queryRaw<any[]>`SELECT valor, finn.hoy()::text AS hoy, current_setting('transaction_isolation') AS iso, current_setting('transaction_read_only') AS ro FROM finn.revision`;
    return x;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  R('T6a lectura RR solo lectura', r);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.asignacion.deleteMany({});
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
} catch (e) { R('T6b escritura en transacción de solo lectura', describir(e)); }

// T7: error de validación del propio Prisma (tipo) y P2025
try { await db.transaccion.update({ where: { id: crypto.randomUUID() }, data: { comercio: 'x' } }); } catch (e) { R('T7 P2025 (sin fila)', describir(e)); }
await db.$disconnect();
