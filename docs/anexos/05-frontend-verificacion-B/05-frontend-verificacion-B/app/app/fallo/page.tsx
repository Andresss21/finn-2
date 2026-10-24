import { connection } from 'next/server';
import { consultar } from '@/lib/consultar';
export default async function P() {
  await connection();
  await consultar(async () => ({ ok: false as const, error: { categoria: 'INTERNO' as const, codigo: 'FN003', mensaje: 'Algo salió mal', idError: 'E-7K2QPX' } }));
  return <p>no llega</p>;
}
