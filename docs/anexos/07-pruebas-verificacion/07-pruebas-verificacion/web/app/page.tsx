import { connection } from 'next/server';
import { relojDePrueba } from '../lib/reloj-prueba';
import { RefrescoMedianoche } from '../cliente/refresco';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit' });
export default async function Pagina() {
  await connection();
  const r = relojDePrueba();
  const hoy = r?.hoy ?? fmt.format(new Date());
  return <main>
    <p data-testid="hoy">{hoy}</p>
    <p data-testid="entorno">{process.env.NODE_ENV}|{process.env.VERCEL_ENV ?? '∅'}|{r ? 'reloj-prueba' : 'reloj-real'}</p>
    <RefrescoMedianoche hoy={hoy} />
  </main>;
}
