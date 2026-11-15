'use client';
// [CH-279, CH-292] «¿Quién paga?» y «¿En qué categorías?» de `/registrar/gasto` (C-45 §4.8, C-49) tal como las usan Editar
// transacción y Revisar movimiento: las personas conocidas son los deudores, el destino de Vos es la categoría elegida o
// «{n} categorías» y, con una sola persona, las categorías dicen de quién es lo que va a Por cobrar.
import { registrarGasto as t } from '../../textos/registrar-gasto';
import type { CamposDeRegistro as Campos } from './campos';
import { Categorias, type CategoriaDelCampo } from './categorias';
import { NUEVA, type EstadoDelGasto } from './estado';
import { QuienPaga, type Bloqueo } from './quien-paga';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export interface PropsSeccionesDelGasto {
  readonly c: Campos;
  readonly e: EstadoDelGasto;
  readonly categorias: readonly CategoriaDelCampo[];
  readonly deudores: readonly Referencia[];
  /** El rechazo del servidor que va junto al resumen de las categorías, si lo hay. */
  readonly deLasPartes: string | undefined;
  readonly poner: (parcial: Partial<Campos>) => void;
  readonly alSalir: (seccion: 'personas' | 'categorias') => () => void;
  readonly anunciar: (texto: string) => void;
  readonly bloqueo?: Bloqueo | undefined;
}

export function SeccionesDelGasto({
  c,
  e,
  categorias,
  deudores,
  deLasPartes,
  poner,
  alSalir,
  anunciar,
  bloqueo,
}: PropsSeccionesDelGasto) {
  const nombreDeCategoria = (id: string) => categorias.find((x) => x.id === id)?.nombre ?? '';
  const unaSola = c.personas.length === 1 ? c.personas[0]?.clave : undefined;
  return (
    <>
      <QuienPaga
        c={c}
        e={e}
        conocidas={deudores.map((d) => ({ clave: d.id, nombre: d.nombre }))}
        destinoDeVos={
          c.varias && c.filas.length > 1
            ? t.nCategorias(c.filas.length)
            : nombreDeCategoria(c.filas[0]?.categoriaId ?? '') || t.elegiUnaCategoria
        }
        poner={poner}
        alSalir={alSalir('personas')}
        bloqueo={bloqueo}
      />
      <Categorias
        c={c}
        e={e}
        categorias={categorias}
        errorServidor={deLasPartes}
        personaUnica={
          unaSola === undefined
            ? undefined
            : unaSola.startsWith(NUEVA)
              ? unaSola.slice(NUEVA.length)
              : deudores.find((d) => d.id === unaSola)?.nombre
        }
        poner={poner}
        alSalir={alSalir('categorias')}
        anunciar={anunciar}
        bloqueo={bloqueo}
      />
    </>
  );
}
