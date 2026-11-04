// Una URL que no es ninguna ruta de la app (fuera de toda página, así que sin el marco): «Esto ya no existe.» en español con
// el estado vacío de 06-identidad-visual 2.19, el glifo de búsqueda y el enlace a Inicio (entrega 2 del diseño, pantalla 14;
// CH-109). Sin él, Next mostraba su 404 en inglés. El `not-found` de `(finn)` es el de `notFound()` en una consulta (05 §7.3).
import { Vacio } from '../componentes/base/vacio';
import { EnlaceFinn } from '../componentes/navegacion/enlace-finn';
import { estados } from '../textos/estados';
import { navegacion } from '../textos/navegacion';

export default function NoExisteLaRuta() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5">
      <Vacio
        titulo={estados.noExisteTitulo}
        texto={estados.noExisteTexto}
        icono="search"
        tono="neutro"
        accion={
          <EnlaceFinn
            href="/"
            className="text-etiqueta inline-flex min-h-11 items-center justify-center rounded-control bg-accion-tonal px-5 font-bold text-accion"
          >
            {estados.irA(navegacion.secciones.inicio)}
          </EnlaceFinn>
        }
      />
    </main>
  );
}
