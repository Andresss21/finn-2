import { EnlaceFinn } from '@/componentes/enlace-finn';
import { connection } from 'next/server';
export default async function Pagina() { await connection();
  return <main><h1 data-render={Date.now()}>Origen</h1><EnlaceFinn id="ir" href="/destino" prefetch={false}>Ir al destino</EnlaceFinn></main>; }
