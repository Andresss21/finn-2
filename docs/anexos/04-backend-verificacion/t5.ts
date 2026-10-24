import { cliente } from './comun.ts';
const db = cliente(1);
const t = await db.transaccion.findFirst({ where: { comercio: { startsWith: 'W' } }, select: { fecha: true } });
const f = t!.fecha;
console.log(process.env.TZ, 'ISO:', f.toISOString(), '| getDate() local:', f.getDate(), '| getUTCDate():', f.getUTCDate(), '| toISOString().slice(0,10):', f.toISOString().slice(0,10));
await db.$disconnect();
