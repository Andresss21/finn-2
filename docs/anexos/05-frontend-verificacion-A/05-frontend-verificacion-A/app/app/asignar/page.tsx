import { connection } from 'next/server';
import { estado } from '@/lib/estado';
import { FormAsignar } from '@/componentes/form-asignar';
export default async function AsignarCompleta() {
  await connection();   // en Finn: la lectura de la sesión (cookies) hace dinámica la página
  return (<main data-testid="pagina-completa"><h1>Asignar (página completa)</h1><FormAsignar asignadoEsperado={estado.asignado} /></main>);
}
