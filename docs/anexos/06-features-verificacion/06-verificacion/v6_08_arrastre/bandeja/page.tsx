import { movimientos, destinos } from './datos';
import { Lista } from './lista';
export const dynamic = 'force-dynamic';
export default async function Pagina({ searchParams }: { searchParams: Promise<{ sinArrastre?: string }> }) {
  const p = await searchParams;
  return <main><h1>Bandeja</h1><Lista movimientos={movimientos} destinos={destinos} conArrastre={p.sinArrastre !== '1'} /></main>;
}
