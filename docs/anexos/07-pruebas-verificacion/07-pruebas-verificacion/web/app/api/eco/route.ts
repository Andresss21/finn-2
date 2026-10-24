import { relojDePrueba } from '../../../lib/reloj-prueba';
export async function GET() { return Response.json({ hoy: relojDePrueba()?.hoy ?? null, nodeEnv: process.env.NODE_ENV }); }
