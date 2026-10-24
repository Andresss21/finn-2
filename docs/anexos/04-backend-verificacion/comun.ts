import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from './generado/prisma/client.ts';
export function cliente(max = 3) {
  const adapter = new PrismaPg({ connectionString: 'postgresql://finn_app:a@127.0.0.1:5433/finn', max });
  return new PrismaClient({ adapter });
}
export { Prisma };
export function describir(e: any) {
  const o: any = { clase: e?.constructor?.name, code: e?.code, meta: e?.meta, message: String(e?.message).split('\n').slice(-3).join(' | ') };
  if (e?.cause) o.cause = { name: e.cause?.name, kind: e.cause?.kind, code: e.cause?.code, originalCode: e.cause?.originalCode, originalMessage: e.cause?.originalMessage };
  return o;
}
