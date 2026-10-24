import { cliente, describir, Prisma } from './comun.ts';
const db = cliente(3);
const dormir = (ms: number) => new Promise(r => setTimeout(r, ms));
const RC = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 30000, maxWait: 5000 };
const RR = { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000, maxWait: 5000 };
const marca = 'W' + Date.now();
async function escritor1(espera: number) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    await tx.transaccion.create({ data: { fecha: new Date('2026-10-10'), horaRegistro: new Date(), claveOrden: new Date(), total: 7, comercio: marca, lineas: { create: [{ orden: 1, monto: 7 }] } } });
    await dormir(espera);
  }, RC);
}
async function escritor2(opts: any) {
  const t0 = Date.now();
  return db.$transaction(async (tx) => {
    const [antes] = await tx.$queryRaw<any[]>`SELECT count(*)::int n FROM finn.transacciones WHERE comercio = ${marca}`;
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    const [desp] = await tx.$queryRaw<any[]>`SELECT count(*)::int n FROM finn.transacciones WHERE comercio = ${marca}`;
    return { esperaMs: Date.now() - t0, vistoAntesDelBloqueo: antes.n, vistoDespuesDelBloqueo: desp.n };
  }, opts);
}
// A) READ COMMITTED: el segundo ve lo confirmado por el primero
{
  const p1 = escritor1(1500); await dormir(200);
  const r = await escritor2(RC); await p1;
  console.log('A READ COMMITTED (patrón aprobado):', r);
}
// B) Contraste: REPEATABLE READ con una lectura antes del bloqueo (RK-05)
{
  const p1 = escritor1(1500); await dormir(200);
  const r = await escritor2(RR); await p1;
  console.log('B REPEATABLE READ con lectura previa (RK-05):', r, '(debería ver 2 filas)');
}
// B2) REPEATABLE READ con el bloqueo como PRIMERA sentencia
{
  const p1 = escritor1(1500); await dormir(200);
  const t0 = Date.now();
  const r = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    const [d] = await tx.$queryRaw<any[]>`SELECT count(*)::int n FROM finn.transacciones WHERE comercio = ${marca}`;
    return d.n;
  }, RR); await p1;
  console.log('B2 REPEATABLE READ, bloqueo primero: vio', r, 'filas (debería ver 3)', Date.now() - t0, 'ms');
}
// C) lock_timeout de 10 s
{
  const p1 = escritor1(11500); await dormir(200);
  const t0 = Date.now();
  try { await escritor2(RC); console.log('C: no falló'); }
  catch (e) { console.log('C lock_timeout tras', Date.now() - t0, 'ms:', JSON.stringify(describir(e))); }
  await p1;
}
await db.$disconnect();
