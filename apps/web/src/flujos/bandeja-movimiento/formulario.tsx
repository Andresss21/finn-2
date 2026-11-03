'use client';
// `/bandeja/[movimientoId]` (FT-35, OP-36 y OP-37; 05 §2.5): revisar un movimiento completo, con el texto del SMS siempre a la
// vista, cambiar lo que hace falta y aprobarlo. «Aprobar» guarda primero lo que cambió (OP-36, con lo que se vio en `esperado`) y
// después aprueba (OP-37); con la fecha en un período cerrado el servidor pide confirmar con AV-01. Es un flujo largo: siempre
// página completa (05 §1.4). No calcula montos (PF-3): la suma de las partes la valida el servidor.
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { faltaRepartir } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion } from '../../formularios/use-operacion';
import {
  aprobarMovimiento,
  editarMovimiento,
  resolverCoincidencia,
} from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import type { ValorAprobado } from './aprobado';
import type { DatosCoincidencia } from './coincidencia';
import { camposIniciales, contrato, entradaDeEdicion, ofreceRecordar, type Campos } from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}
export interface PropsFormularioMovimiento {
  readonly movimiento: {
    readonly id: string;
    readonly estado: string;
    readonly sms: string;
    readonly esperado: Readonly<Record<string, unknown>>;
    readonly origenId?: string;
    /** Con una coincidencia sobre una transacción programada (OP-40): lo que se muestra de ella. */
    readonly coincidencia?: DatosCoincidencia;
  };
  /** Viene de la fila de la lista (05 §4.15): se vuelve a aprobar para mostrar el mensaje o la confirmación. */
  readonly traspaso: boolean;
  readonly cuentas: readonly Referencia[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: number } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Los rechazos que se muestran junto al campo de las partes, no como aviso del formulario. */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
const FINALES = ['aprobado', 'descartado', 'autodescartado'];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
    default: m.ConfirmacionImpacto,
  })),
);

const Coincidencia = lazy(() =>
  import('./coincidencia').then((m) => ({ default: m.Coincidencia })),
);
const ResultadoDeAprobar = lazy(() => import('./resultado'));
const YaResuelto = lazy(() => import('./ya-resuelto'));

const Edicion = lazy(() => import('./edicion'));

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
  const aprobado = props.movimiento.estado === 'aprobado';
  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
      <Suspense fallback={null}>
        <YaResuelto aprobado={aprobado}>
          <TextoDelSms texto={props.movimiento.sms} />
        </YaResuelto>
      </Suspense>
    </PaginaFlujoDeRuta>
  );
}

function Flujo({ movimiento, cuentas, categorias, deudores, traspaso }: PropsFormularioMovimiento) {
  const editar = useOperacion({ accion: editarMovimiento });
  const aprobarSolo = useOperacion({ accion: aprobarMovimiento, creacion: true });
  const coincide = useOperacion({ accion: resolverCoincidencia, creacion: true });
  // Confirmar una coincidencia es aprobar (OP-40 ejecuta OP-37): lo que ya se envió por ahí manda
  const aprobar = ['enviando', 'confirmando', 'listo'].includes(coincide.estado)
    ? coincide
    : aprobarSolo;
  const inicial = useMemo(() => camposIniciales(movimiento.esperado), [movimiento.esperado]);
  const base = useRef(inicial); // lo último guardado en el servidor, para saber qué cambió
  const visto = useRef(movimiento.esperado); // lo que vio la persona (FE-09), para OP-36
  // lo que se aprueba (o confirma, OP-40) al terminar de guardar
  const pendiente = useRef<{
    campos: Campos;
    entrada: Record<string, unknown>;
    confirmando: boolean;
  } | null>(null);
  const [recordar, setRecordar] = useState(false);
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion: editar,
  });
  const { control } = formulario;
  const partes = useFieldArray({ control, name: 'lineas' });
  const c = formulario.watch();
  const { enviar: aprobarAhora } = aprobarSolo;
  const { enviar: confirmarAhora } = coincide;

  const entradaDeAprobar = (campos: Campos, confirmando: boolean): Record<string, unknown> => ({
    ...(confirmando ? { decision: 'confirmar_coincidencia' } : {}),
    movimientoId: movimiento.id,
    ...(movimiento.origenId === undefined ? {} : { origenId: movimiento.origenId }),
    ...(recordar && ofreceRecordar(campos) ? { recordarRegla: true } : {}),
  });

  // El traspaso de la lista (05 §4.15): se vuelve a aprobar y el servidor repite su mensaje o su confirmación
  const { id: movimientoId, origenId } = movimiento;
  useEffect(() => {
    if (traspaso)
      void aprobarAhora({ movimientoId, ...(origenId === undefined ? {} : { origenId }) });
  }, [traspaso, movimientoId, origenId, aprobarAhora]);

  // Terminó de guardar los cambios: se aprueba lo que se guardó
  useEffect(() => {
    if (editar.estado !== 'listo' || pendiente.current === null) return;
    const { campos, entrada, confirmando } = pendiente.current;
    pendiente.current = null;
    base.current = campos;
    void (confirmando ? confirmarAhora : aprobarAhora)(entrada);
  }, [editar.estado, aprobarAhora, confirmarAhora]);

  // Lo que se guardó pasa a ser lo que se vio (la revalidación trae los valores nuevos)
  useEffect(() => {
    if (editar.estado === 'listo') visto.current = movimiento.esperado;
  }, [editar.estado, movimiento.esperado]);

  // «Aprobar» y «Confirmar» (coincidencia) guardan primero lo que cambió y después aprueban (OP-37 u OP-40)
  const alEnviar = (confirmando: boolean) =>
    formulario.handleSubmit((campos) => {
      const cambios = entradaDeEdicion(movimiento.id, base.current, campos, visto.current);
      const entrada = entradaDeAprobar(campos, confirmando);
      if (cambios === undefined) return (confirmando ? confirmarAhora : aprobarAhora)(entrada);
      pendiente.current = { campos, entrada, confirmando };
      return editar.enviar(cambios);
    });

  const fallo = [editar, aprobarSolo, coincide].find((o) => o.estado === 'error')?.error;
  const deLasPartes =
    fallo !== undefined && DE_LAS_PARTES.includes(fallo.codigo) ? fallo.mensaje : undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado';
  const vista = (aprobar.previsualizacion ?? {}) as Previsualizacion;
  const enviando = editar.estado === 'enviando' || aprobar.estado === 'enviando';

  if (aprobar.estado === 'listo' && aprobar.exito !== undefined) {
    const valor = aprobar.exito.valor as ValorAprobado;
    return (
      <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
        <Suspense fallback={null}>
          <ResultadoDeAprobar valor={valor} />
        </Suspense>
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

  const falta = faltaRepartir(
    c.total,
    c.lineas.map((l) => l.monto),
  );
  const ayuda =
    falta === undefined
      ? undefined
      : falta > 0
        ? g.faltaRepartir(formatearMonto(falta))
        : falta < 0
          ? g.sobraRepartir
          : g.todoRepartido;

  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja">
      <form onSubmit={(e) => void alEnviar(false)(e)} noValidate className="flex flex-col gap-5">
        {movimiento.coincidencia === undefined ? null : (
          <Suspense fallback={null}>
            <Coincidencia
              coincidencia={movimiento.coincidencia}
              enviando={coincide.estado === 'enviando'}
              deshabilitado={!coincide.enLinea}
              alConfirmar={() => void alEnviar(true)()}
            />
          </Suspense>
        )}
        <TextoDelSms texto={movimiento.sms} />
        <Suspense fallback={null}>
          <Edicion
            formulario={formulario}
            partes={partes}
            cuentas={cuentas}
            categorias={categorias}
            deudores={deudores}
            deLasPartes={deLasPartes}
            ayuda={ayuda}
          />
        </Suspense>
        {ofreceRecordar(c) ? (
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
        {fallo !== undefined &&
        deLasPartes === undefined &&
        !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(conflicto || REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() => {
                        if (conflicto) {
                          visto.current = { ...visto.current, ...fallo.datos };
                          editar.volverAEditar();
                        } else
                          void [editar, aprobarSolo, coincide]
                            .find((o) => o.estado === 'error')
                            ?.reintentar();
                      }}
                    >
                      {conflicto ? formularios.usarValorActual : formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {fallo.mensaje}
          </AvisoEnLinea>
        ) : null}
        <Boton
          tipo="submit"
          enviando={enviando}
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
