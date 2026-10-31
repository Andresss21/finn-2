// «Esto ya no existe.» (05 §7.3, V5-17): `notFound()` de `consultar()` llega acá. El enlace lleva a la sección de la ruta
// que se pidió (FE-29), que `proxy.ts` deja en `x-finn-ruta`; fuera de una sección, a Inicio.
import { headers } from 'next/headers';
import { Vacio } from '../../componentes/base/vacio';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { rutaInterna } from '@finn/aplicacion/autenticacion';
import { SECCIONES, seccionDeRuta } from '../../componentes/navegacion/secciones';
import { estados } from '../../textos/estados';

export default async function NoExiste() {
  const ruta = rutaInterna((await headers()).get('x-finn-ruta')).split('?')[0] ?? '/';
  const id = seccionDeRuta(ruta) ?? 'inicio';
  const seccion = SECCIONES.find((s) => s.id === id);
  return (
    <main>
      <Vacio
        titulo={estados.noExisteTitulo}
        texto={estados.noExisteTexto}
        accion={
          seccion === undefined ? undefined : (
            <EnlaceFinn href={seccion.ruta}>{estados.irA(seccion.etiqueta)}</EnlaceFinn>
          )
        }
      />
    </main>
  );
}
