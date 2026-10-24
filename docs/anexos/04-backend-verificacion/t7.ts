import { cliente } from './comun.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generado/prisma/client.ts';
async function probar(nombre: string, db: any) {
  const d = new Date('2026-10-14T04:00:00.000Z');
  const r = await db.$transaction(async (tx: any) => {
    await tx.$executeRaw`SELECT finn.tomar_bloqueo()`;
    const t = await tx.transaccion.create({ data: { fecha: new Date('2026-10-12T00:00:00Z'), horaRegistro: d, claveOrden: d, total: 1, lineas: { create: [{ orden: 1, monto: 1 }] } }, select: { id: true, horaRegistro: true } });
    const [x] = await tx.$queryRaw<any[]>`SELECT to_char(hora_registro AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS utc, current_setting('TimeZone') tzsesion FROM finn.transacciones WHERE id = ${t.id}::uuid`;
    const [y] = await tx.$queryRaw<any[]>`SELECT ${d}::timestamptz AS eco_param`;
    return { enviado: d.toISOString(), devueltoPorPrisma: t.horaRegistro.toISOString(), guardadoUTC: x.utc, tzSesion: x.tzsesion, ecoParamRaw: y.eco_param.toISOString() };
  });
  console.log(nombre, r); await db.$disconnect();
}
await probar('A sesión con TimeZone del servidor:', cliente(1));
await probar('B sesión con options=-c TimeZone=UTC:', new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://finn_app:a@127.0.0.1:5433/finn', options: '-c TimeZone=UTC', max: 1 }) }));
