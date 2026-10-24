import { connection } from 'next/server';
import { estado } from '@/lib/estado';
import { FormAsignar } from '@/componentes/form-asignar';
export default async function AsignarSuperpuesto() {
  await connection();   // en Finn: la lectura de la sesión (cookies) hace dinámica la página
  return (<section role="dialog" aria-label="Asignar" data-testid="superpuesto"><FormAsignar asignadoEsperado={estado.asignado} enSuperpuesto /></section>);
}
