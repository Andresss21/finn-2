import { connection } from 'next/server';
export default async function L() { await connection(); await new Promise((r) => setTimeout(r, 2000)); return <main data-testid="lento-listo">listo</main>; }
