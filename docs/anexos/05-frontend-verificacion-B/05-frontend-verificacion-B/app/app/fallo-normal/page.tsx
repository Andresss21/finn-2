import { connection } from 'next/server';
export default async function P() { await connection(); throw new Error('detalle interno con datos'); }
