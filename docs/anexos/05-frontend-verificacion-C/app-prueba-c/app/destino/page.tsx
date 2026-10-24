import { connection } from 'next/server';
import { EnlaceFinn } from '@/componentes/enlace-finn';
export default async function Pagina() { await connection(); await new Promise((r) => setTimeout(r, 1500));
  return <main><h1 id="destino" data-render={Date.now()}>Destino</h1><EnlaceFinn id="volver" href="/inicio-nav" prefetch={false}>Volver</EnlaceFinn></main>; }
