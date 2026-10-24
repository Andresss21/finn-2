import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generado/prisma/client.ts';
for (const [nombre, opt] of [['sesión America/Guatemala', undefined], ['sesión UTC', '-c TimeZone=UTC']] as const) {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://finn_app:a@127.0.0.1:5433/finn', ...(opt ? { options: opt } : {}), max: 1 }) });
  const r = await db.$transaction(async (tx: any) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    const d = new Date('2026-10-14T04:00:00.000Z');
    const t = await tx.transaccion.create({ data: { fecha: new Date('2026-10-12T00:00:00Z'), horaRegistro: d, claveOrden: d, total: 1, lineas: { create: [{ orden: 1, monto: 1 }] } }, select: { id: true } });
    await tx.$executeRaw`UPDATE finn.transacciones SET hora_registro = '2026-10-14T04:00:00Z'::timestamptz, clave_orden = clave_orden + interval '1 ms' WHERE id = ${t.id}::uuid`;
    const leido = await tx.transaccion.findUnique({ where: { id: t.id }, select: { horaRegistro: true } });
    return { escritoPorSQL: '2026-10-14T04:00:00.000Z', leidoPorPrisma: leido.horaRegistro.toISOString() };
  });
  console.log(`TZ proceso=${process.env.TZ ?? 'sin TZ'} | ${nombre}:`, r); await db.$disconnect();
}
