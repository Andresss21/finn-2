import { connection } from 'next/server';
export default async function L() { await connection(); await new Promise((r) => setTimeout(r, 2000)); return <section role="dialog" aria-label="Lento" data-testid="lento-listo">listo</section>; }
