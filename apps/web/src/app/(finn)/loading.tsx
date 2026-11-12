// Estado de carga de `(finn)` (E6-1, FE-33, GLO-32; `T1-carga/inicio`): lo que carga Inicio y toda pantalla que no trae el suyo. Este
// archivo no conoce la ruta, así que no pone título: la barra queda sin título y el cuerpo, en esqueleto, sin números inventados.
import { BloqueGrafico, Esqueleto, SeccionEsqueleto } from '../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <Esqueleto pantalla="la pantalla">
        <BloqueGrafico />
        <SeccionEsqueleto filas={3} />
        <SeccionEsqueleto filas={2} />
      </Esqueleto>
    </main>
  );
}
