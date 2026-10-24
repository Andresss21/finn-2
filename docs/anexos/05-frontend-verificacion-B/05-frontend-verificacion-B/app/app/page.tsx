import { connection } from 'next/server';
import Link from 'next/link';
import { estado } from '@/lib/estado';
import { FormAsignar } from '@/componentes/form-asignar';
import { FormCrear } from '@/componentes/form-crear';
import { Sugerencia } from '@/componentes/sugerencia';
import { Refrescar } from '@/componentes/refrescar';
import { EnlaceConEstado } from '@/componentes/enlace-con-estado';
export default async function Inicio() {
  await connection();   // en Finn: la lectura de la sesión (cookies) hace dinámica la página
  return (<main>
    <p data-testid="servidor">rev {estado.revision} · lpa {estado.lpa} · asignado {estado.asignado} · creadas {estado.creadas.size} · llamadas {estado.llamadas.length}</p>
    <Link href="/asignar">Abrir asignar</Link> <Link href="/otra">Otra</Link> <Link href="/lento">Abrir lento</Link> <Link href="/lento2">Abrir lento normal</Link> <Link href="/lento2" prefetch={false}>Normal sin prefetch</Link> <Link href="/lento" prefetch={false}>Interceptada sin prefetch</Link> <EnlaceConEstado href="/lento2">Normal sin prefetch con estado</EnlaceConEstado> <EnlaceConEstado href="/lento">Interceptada sin prefetch con estado</EnlaceConEstado>
    <FormAsignar asignadoEsperado={estado.asignado} />
    <FormCrear /><Sugerencia /><Refrescar />
  </main>);
}
