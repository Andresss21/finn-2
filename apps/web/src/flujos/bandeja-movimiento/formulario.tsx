'use client';
// `/bandeja/[movimientoId]` (FT-35, OP-36 y OP-37; 05 §2.5): revisar un movimiento con el texto del SMS siempre a la vista,
// elegir su categoría y aprobarlo: «Aprobar» guarda primero la categoría (OP-36) y después aprueba (OP-37); con la fecha en un
// período cerrado el servidor pide confirmar con AV-01. Flujo largo: página completa (05 §1.4). No calcula montos (PF-3).
import { lazy, Suspense, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { useOperacion } from '../../formularios/use-operacion';
import {
  aprobarMovimiento,
  editarMovimiento,
  resolverCoincidencia,
} from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { textoAprobado, type ValorAprobado } from './aprobado';
import type { DatosCoincidencia } from './coincidencia';

export interface PropsFormularioMovimiento {
  readonly movimiento: {
    readonly id: string;
    readonly sms: string;
    readonly comercio: string | null;
    /** El monto en texto decimal, para la línea de OP-36. */
    readonly montoTexto: string | null;
    readonly tipo: string | null;
    readonly partes: number;
    readonly categoriaId: string | null;
    readonly origenId?: string;
    readonly esperado: Readonly<Record<string, unknown>>;
    readonly estado: string;
    /** Con una coincidencia sobre un pago programado (OP-40): lo que se muestra de ella. */
    readonly coincidencia?: DatosCoincidencia;
  };
  readonly categorias: readonly { readonly id: string; readonly nombre: string }[];
  /** Viene de la fila de la lista (05 §4.15): se vuelve a aprobar para mostrar el mensaje o la confirmación. */
  readonly traspaso: boolean;
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: number } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
    default: m.ConfirmacionImpacto,
  })),
);

const Coincidencia = lazy(() =>
  import('./coincidencia').then((m) => ({ default: m.Coincidencia })),
);
const YaResuelto = lazy(() => import('./ya-resuelto'));
const FINALES = ['aprobado', 'descartado', 'autodescartado'];

function TextoDelSms({ texto }: { readonly texto: string }) {
  return (
    <section aria-label={t.revisar.sms} className="flex flex-col gap-1">
      <h2 className="text-cuerpo-pequeno font-bold text-texto-secundario">{t.revisar.sms}</h2>
      <blockquote className="rounded-xl bg-superficie-hundida p-3 text-cuerpo-pequeno text-texto">
        {texto}
      </blockquote>
    </section>
  );
}

export function FormularioMovimiento(props: PropsFormularioMovimiento) {
  // Si al abrir ya está aprobado o descartado se muestra su estado; si no, el flujo sigue montado aunque la revalidación
  // cambie su estado al aprobar (el resultado es suyo).
  const [abierto] = useState(() => !FINALES.includes(props.movimiento.estado));
  if (abierto) return <Flujo {...props} />;
  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
      <Suspense fallback={null}>
        <YaResuelto aprobado={props.movimiento.estado === 'aprobado'}>
          <TextoDelSms texto={props.movimiento.sms} />
        </YaResuelto>
      </Suspense>
    </PaginaFlujoDeRuta>
  );
}

function Flujo({ movimiento: m, categorias, traspaso }: PropsFormularioMovimiento) {
  const editar = useOperacion({ accion: editarMovimiento });
  const aprobarSolo = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const coincide = useOperacion({ accion: resolverCoincidencia, creacion: true });
  // Confirmar una coincidencia es aprobar (OP-40 ejecuta OP-37): lo que ya se envió por ahí manda
  const aprobar = ['enviando', 'confirmando', 'listo'].includes(coincide.estado)
    ? coincide
    : aprobarSolo;
  const [categoriaId, setCategoriaId] = useState(m.categoriaId ?? '');
  const [recordar, setRecordar] = useState(false);
  // la aprobación (o la confirmación de la coincidencia, OP-40) que sigue a guardar
  const pendiente = useRef<{ entrada: Record<string, unknown>; confirmando: boolean } | null>(null);
  const { enviar: aprobarAhora } = aprobarSolo;
  const { enviar: confirmarAhora } = coincide;
  const conCategoria = m.tipo === 'gasto' && m.partes <= 1 && m.montoTexto !== null;

  const { id, origenId } = m;
  useEffect(() => {
    if (traspaso)
      void aprobarAhora({ movimientoId: id, ...(origenId === undefined ? {} : { origenId }) });
  }, [traspaso, id, origenId, aprobarAhora]);

  // Terminó de guardar la categoría: se aprueba
  useEffect(() => {
    if (editar.estado !== 'listo' || pendiente.current === null) return;
    const { entrada, confirmando } = pendiente.current;
    pendiente.current = null;
    void (confirmando ? confirmarAhora : aprobarAhora)(entrada);
  }, [editar.estado, aprobarAhora, confirmarAhora]);

  // «Aprobar» y «Confirmar» (coincidencia) guardan primero la categoría elegida y después aprueban (OP-37 u OP-40)
  const enviar = (confirmando: boolean): void => {
    const entrada = {
      ...(confirmando ? { decision: 'confirmar_coincidencia' } : {}),
      movimientoId: id,
      ...(origenId === undefined ? {} : { origenId }),
      ...(recordar && conCategoria && categoriaId !== '' ? { recordarRegla: true } : {}),
    };
    if (!conCategoria || categoriaId === '' || categoriaId === m.categoriaId) {
      void (confirmando ? confirmarAhora : aprobarAhora)(entrada);
      return;
    }
    pendiente.current = { entrada, confirmando };
    void editar.enviar({
      movimientoId: id,
      lineas: [{ monto: m.montoTexto, destino: { categoriaId } }],
      esperado: m.esperado,
    });
  };

  const alAprobar = (evento: SyntheticEvent): void => {
    evento.preventDefault();
    enviar(false);
  };

  const fallo = [editar, aprobarSolo, coincide].find((o) => o.estado === 'error')?.error;
  const vista = (aprobar.previsualizacion ?? {}) as Previsualizacion;

  if (aprobar.estado === 'listo' && aprobar.exito !== undefined) {
    const valor = aprobar.exito.valor as ValorAprobado;
    return (
      <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
        <div className="flex flex-col gap-4">
          <Resultado
            texto={textoAprobado(valor)}
            enlace={
              <EnlaceFinn href={`/actividad/${valor.transaccionId}`}>{t.verTransaccion}</EnlaceFinn>
            }
          />
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  if (aprobar.estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar.revisarImpacto}
            {...(aprobar.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            impacto={
              vista.impacto
                ? [
                    g.impactoLpa(
                      `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa as never)}`,
                    ),
                  ]
                : []
            }
            avisos={(vista.avisos ?? []).map((a) =>
              a.codigo === 'AV-01' ? g.avisoPeriodoCerrado : a.codigo,
            )}
            textoConfirmar={g.confirmar}
            textoVolver={g.volverAEditar}
            enviando={false}
            alConfirmar={() => void aprobar.confirmar()}
            alVolver={aprobar.volverAEditar}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
      <form onSubmit={alAprobar} className="flex flex-col gap-5">
        {m.coincidencia === undefined ? null : (
          <Suspense fallback={null}>
            <Coincidencia
              coincidencia={m.coincidencia}
              enviando={coincide.estado === 'enviando'}
              deshabilitado={!coincide.enLinea}
              alConfirmar={() => {
                enviar(true);
              }}
            />
          </Suspense>
        )}
        <TextoDelSms texto={m.sms} />
        {conCategoria ? (
          <Seleccion
            etiqueta={t.revisar.categoria}
            opciones={categorias.map((x) => ({ valor: x.id, etiqueta: x.nombre }))}
            valor={categoriaId}
            alCambiar={setCategoriaId}
          />
        ) : null}
        {conCategoria && categoriaId !== '' && m.comercio !== null ? (
          <label className="flex min-h-11 items-center gap-3 rounded-contenedor bg-superficie px-3.5">
            <input
              type="checkbox"
              className="size-5 shrink-0"
              checked={recordar}
              onChange={(e) => {
                setRecordar(e.target.checked);
              }}
            />
            <span>{t.revisar.recordar}</span>
          </label>
        ) : null}
        {fallo === undefined ? null : (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() =>
                        void [editar, aprobarSolo, coincide]
                          .find((o) => o.estado === 'error')
                          ?.reintentar()
                      }
                    >
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        )}
        <Boton
          tipo="submit"
          enviando={editar.estado === 'enviando' || aprobar.estado === 'enviando'}
          textoEnviando={t.revisar.aprobando}
          deshabilitado={!aprobar.enLinea}
          {...(aprobar.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: aprobar.motivoSinEnvio })}
        >
          {t.revisar.aprobar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
