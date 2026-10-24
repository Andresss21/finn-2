import { connection } from 'next/server';
import { EnlaceFinn } from '@/componentes/enlace-finn';
export default async function Pagina() { await connection();
  return <main><h1 id="datos" data-render={Date.now()}>Datos</h1><EnlaceFinn id="a-destino" href="/destino">Ir al destino</EnlaceFinn></main>; }
