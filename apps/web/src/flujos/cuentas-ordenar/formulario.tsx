'use client';
// `/cuentas/ordenar` (FT-53, OP-03; 05 §2.7): el flujo corto de ordenar las cuentas abiertas. Cada tipo se ordena entre sus
// cuentas con «Subir» y «Bajar» (sin arrastrar: funciona con teclado y con un toque). Envía la lista completa en el orden nuevo;
// si las cuentas cambiaron mientras tanto, el servidor responde `conflicto_desactualizado` y se pide recargar.
import { useCallback, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { formularios } from '../../textos/formularios';

const t = cuentasGestion.ordenar;
const RUTA_PADRE = '/cuentas';
const TIPOS = ['efectivo', 'tarjeta', 'prestamo', 'inversion'] as const;
export type TipoOrdenable = (typeof TIPOS)[number];

interface Fila {
  readonly id: string;
  readonly nombre: string;
  readonly tipo: TipoOrdenable;
}

export interface PropsFormularioCuentasOrdenar {
  /** `ordenarCuentas` (OP-03): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  /** Las cuentas abiertas, agrupadas por tipo y en el orden vigente. */
  readonly cuentas: readonly Fila[];
}

/** Cambia de lugar la fila con la vecina de su mismo tipo, hacia arriba (-1) o hacia abajo (1). */
function mover(lista: readonly Fila[], id: string, paso: -1 | 1): readonly Fila[] {
  const i = lista.findIndex((f) => f.id === id);
  const fila = lista[i];
  if (fila === undefined) return lista;
  let j = i + paso;
  while (lista[j] !== undefined && lista[j]?.tipo !== fila.tipo) j += paso;
  const otra = lista[j];
  if (otra === undefined || otra.tipo !== fila.tipo) return lista;
  return lista.map((f, k) => (k === i ? otra : k === j ? fila : f));
}

export function FormularioCuentasOrdenar({ accion, cuentas }: PropsFormularioCuentasOrdenar) {
  const [lista, setLista] = useState<readonly Fila[]>(cuentas);
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion({ ...(payload as object), orden: lista.map((f) => f.id) }),
    [accion, lista],
  );
  const operacion = useOperacion({ accion: enviar });
  const { estado, error: fallo } = operacion;

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );
  const conflicto = fallo?.codigo === 'conflicto_desactualizado';
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre={RUTA_PADRE}>
      <div className="flex flex-col gap-5">
        {TIPOS.map((tipo) => {
          const grupo = lista.filter((f) => f.tipo === tipo);
          if (grupo.length === 0) return null;
          return (
            <section key={tipo} aria-label={cuentasGestion.comunes.tipos[tipo]}>
              <h2 className="text-titulo-seccion">{cuentasGestion.comunes.tipos[tipo]}</h2>
              <ol className="flex flex-col gap-2">
                {grupo.map((f, k) => (
                  <li
                    key={f.id}
                    data-fila-cuenta
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold">{f.nombre}</span>
                    <span className="flex gap-2">
                      {(
                        [
                          [-1, t.subirCorto, t.subir(f.nombre), k === 0],
                          [1, t.bajarCorto, t.bajar(f.nombre), k === grupo.length - 1],
                        ] as const
                      ).map(([paso, corto, largo, tope]) => (
                        <Boton
                          key={paso}
                          variante="secundaria"
                          aria-label={largo}
                          deshabilitado={tope}
                          onClick={() => {
                            setLista((l) => mover(l, f.id, paso));
                          }}
                        >
                          {corto}
                        </Boton>
                      ))}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
        {estado === 'error' && fallo !== undefined ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            accion={
              <Boton
                variante="secundaria"
                onClick={conflicto ? operacion.recargar : () => void operacion.reintentar()}
              >
                {conflicto ? formularios.recargar : formularios.intentarDeNuevo}
              </Boton>
            }
          >
            {conflicto ? t.conflicto : fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
        <Boton
          enviando={estado === 'enviando'}
          textoEnviando={t.guardando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          onClick={() => void operacion.enviar({})}
        >
          {t.guardar}
        </Boton>
      </div>
    </PaginaFlujoDeRuta>
  );
}
