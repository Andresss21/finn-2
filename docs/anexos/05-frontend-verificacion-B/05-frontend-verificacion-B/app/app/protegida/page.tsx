import { connection } from 'next/server';
import { consultar } from '@/lib/consultar';
export default async function P() {
  await connection();
  await consultar(async () => ({ ok: false as const, error: { categoria: 'NO_AUTORIZADO' as const, codigo: 'sesion', mensaje: '' } }));
  return <p>no llega</p>;
}
