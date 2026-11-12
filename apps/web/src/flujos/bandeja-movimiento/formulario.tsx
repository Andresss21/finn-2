'use client';
// `/bandeja/[movimientoId]` (FT-35, OP-36 y OP-37; 05 §2.5): revisar un movimiento completo, con el texto del SMS siempre a la
// vista, cambiar lo que hace falta y aprobarlo. «Aprobar» guarda primero lo que cambió (OP-36, con lo que se vio en `esperado`) y
// después aprueba (OP-37); con la fecha en un período cerrado el servidor pide confirmar con AV-01. Es un flujo largo: siempre
// página completa (05 §1.4). No calcula montos (PF-3): la suma de las partes la valida el servidor. CH-136 lo porta del export (S4): encabezado,
// campos con selección nativa y líneas compactas, y el pie fijo con «Aprobar $X» y las salidas del movimiento.
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import type { FechaLocal } from '@finn/dominio/valores';
import { useFieldArray } from 'react-hook-form';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { faltaRepartir, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion } from '../../formularios/use-operacion';
import {
  aprobarMovimiento,
  crearAMano,
  editarMovimiento,
  resolverCoincidencia,
} from '../../servidor/acciones/bandeja';
import { buscarComprasDevolucion } from '../../servidor/lecturas/interactivas';
import { bandeja as t } from '../../textos/bandeja';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import type { ValorAprobado } from './aprobado';
import type { DatosCoincidencia } from './coincidencia';
import { TextoDelSms } from './texto-sms';
import type { CuentaDelMovimiento } from './campos-movimiento';
import type { ResumenDelMovimiento } from './encabezado';
import type { DuplicadoDe } from './estados';
import {
  motivoFaltantes,
  camposIniciales,
  conCategoriaSoltada,
  contrato,
  entradaDeEdicion,
  extrasDeAprobar,
  ofreceRecordar,
  type Campos,
  type CompraCandidata,
} from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}
export interface PropsFormularioMovimiento {
  readonly movimiento: {
    readonly id: string;
    readonly estado: string;
    readonly sms: string;
    /** Solo en un SMS con error: el detalle saneado de su último intento (FT-38). */
    readonly errorDetalle?: string;
    readonly esperado: Readonly<Record<string, unknown>>;
    readonly origenId?: string;
    /** Con una coincidencia sobre una transacción programada (OP-40): lo que se muestra de ella. */
    readonly coincidencia?: DatosCoincidencia;
    /** Lo que dice el encabezado (S4): el estado, el comercio, el monto y la categoría sugerida con su origen. */
    readonly resumen: ResumenDelMovimiento;
    readonly nota: string | null;
    /** Solo en un posible duplicado: el gasto con el que coincide. */
    readonly duplicado?: DuplicadoDe;
    /** Solo en un SMS con error: lo que necesita «Intentar de nuevo» (OP-49). */
    readonly reproceso?: { readonly smsId: string; readonly intentoVisto: number };
  };
  /** El movimiento que sigue en el orden de la Bandeja, para «Siguiente movimiento» (CH-245: sin lista lateral). */
  readonly siguienteId?: string;
  /** Viene de la fila de la lista (05 §4.15): se vuelve a aprobar para mostrar el mensaje o la confirmación. */
  readonly traspaso: boolean;
  /** FT-78: la categoría que se soltó sobre la fila; se pone en la línea y el traspaso envía la variante de OP-37. */
  readonly categoriaSoltada?: string;
  /** [CH-240 E6-5] `conflicto_desactualizado` al soltar: la categoría que vio la lista (`''`: ninguna). No aprueba hasta «Usar el valor actual». */
  readonly categoriaVista?: string;
  readonly cuentas: readonly CuentaDelMovimiento[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** CH-226 (A12): el `hoy` del servidor, del que salen «Hoy» y «Ayer». */
  readonly hoy: FechaLocal;
  /** CH-226 (D8): las compras candidatas de una devolución, ya formateadas. */
  readonly candidatas: readonly CompraCandidata[];
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

/** Los rechazos que se muestran junto al campo de las partes, no como aviso del formulario. */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
const FINALES = ['aprobado', 'descartado', 'autodescartado'];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);

const Coincidencia = lazy(() =>
  import('./coincidencia').then((m) => ({ default: m.Coincidencia })),
);
const ResultadoDeAprobar = lazy(() => import('./resultado'));
const Resolucion = lazy(() => import('./resolucion'));
const DetalleError = lazy(() => import('./detalle-error'));
const Descartado = lazy(() => import('./descartado'));
const YaResuelto = lazy(() => import('./ya-resuelto'));
const EstadoPropio = lazy(() => import('./estados'));

const CamposMovimiento = lazy(() => import('./campos-movimiento'));
const Encabezado = lazy(() => import('./encabezado'));
const SinCuentasDeMovimiento = lazy(() => import('./sin-cuentas-movimiento'));

const ID_FORMULARIO = 'formulario-revisar-movimiento';

/** El nombre de una categoría por su id; `''` o `null`: «sin categoría». */
const nombreCategoria = (categorias: readonly Referencia[], id: string | null): string =>
  (id === null || id === '' ? undefined : categorias.find((c) => c.id === id)?.nombre) ??
  t.revisar.conflictoArrastre.sinCategoria;
/** La categoría de la primera línea de lo que hay ahora en el servidor. */
const categoriaActual = (lineas: unknown): string | null =>
  Array.isArray(lineas)
    ? ((lineas[0] as { categoriaId?: string | null } | undefined)?.categoriaId ?? null)
    : null;

/** El marco de la página, el mismo en todas las pantallas del flujo: título y ruta padre. */
type Marco = Omit<ComponentProps<typeof PaginaFlujoDeRuta>, 'children' | 'acciones'>;

export function FormularioMovimiento(props: PropsFormularioMovimiento) {
  // Si al abrir ya está aprobado o descartado se muestra su estado; si no, el flujo sigue montado aunque la revalidación
  // cambie su estado al aprobar (el resultado es suyo).
  const [abierto] = useState(() => !FINALES.includes(props.movimiento.estado));
  const { movimiento: m } = props;
  const marco: Marco = { titulo: t.revisar.titulo, rutaPadre: '/bandeja' };
  return (
    <>
      {abierto ? (
        <Flujo {...props} marco={marco} />
      ) : (
        <Suspense fallback={null}>
          <YaResuelto
            marco={marco}
            aprobado={m.estado === 'aprobado'}
            movimientoId={m.id}
            sms={m.sms}
            nota={m.nota}
            resumen={m.resumen}
          />
        </Suspense>
      )}
    </>
  );
}

function Flujo({
  movimiento,
  cuentas,
  categorias,
  deudores,
  traspaso,
  categoriaSoltada,
  categoriaVista,
  marco,
  siguienteId: siguienteAlAbrir,
  hoy,
  candidatas,
}: PropsFormularioMovimiento & { readonly marco: Marco }) {
  const [aMano, setAMano] = useState(false); // «Registrar a mano»: un SMS que no se leyó pasa a sus campos
  const [siguienteId] = useState(() => siguienteAlAbrir); // el que seguía al abrir: la lista ya no trae este movimiento al aprobar
  const conCoincidencia = movimiento.estado === 'con_coincidencia';
  const sinLeer = movimiento.estado === 'no_reconocido' || movimiento.estado === 'error';
  // Sin «Aprobar»: un posible duplicado y un SMS que no se leyó se resuelven con las decisiones del pie (S4 del export)
  const propio = movimiento.estado === 'posible_duplicado' || (sinLeer && !aMano);
  const editar = useOperacion({ accion: editarMovimiento });
  // Un SMS con error se aprueba con OP-50 (crear a mano, FT-38); el resto con OP-37
  const aprobarSolo = useOperacion({
    accion: movimiento.estado === 'error' ? crearAMano : aprobarMovimiento,
    creacion: true,
  });
  const coincide = useOperacion({ accion: resolverCoincidencia, creacion: true });
  // Confirmar una coincidencia es aprobar (OP-40 ejecuta OP-37): lo que ya se envió por ahí manda
  const aprobar = ['enviando', 'confirmando', 'listo'].includes(coincide.estado)
    ? coincide
    : aprobarSolo;
  const inicial = useMemo(
    () => camposIniciales(movimiento.esperado, movimiento.origenId),
    [movimiento.esperado, movimiento.origenId],
  );
  // Con una categoría soltada, el formulario la muestra en la línea; `base` sigue siendo lo que hay en el servidor
  const valores = useMemo(
    () =>
      categoriaSoltada === undefined ? inicial : conCategoriaSoltada(inicial, categoriaSoltada),
    [inicial, categoriaSoltada],
  );
  const base = useRef(inicial); // lo último guardado en el servidor, para saber qué cambió
  const visto = useRef(movimiento.esperado); // lo que vio la persona (FE-09), para OP-36
  // lo que se aprueba (o confirma, OP-40) al terminar de guardar
  const pendiente = useRef<{
    campos: Campos;
    entrada: Record<string, unknown>;
    confirmando: boolean;
  } | null>(null);
  const [recordar, setRecordar] = useState(false);
  const [descartado, setDescartado] = useState(false); // FT-37: lo descartó aquí, con «Restaurar» en su lugar
  const alDescartar = useCallback(() => {
    setDescartado(true);
  }, []);
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: valores,
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
    // El origen elegido de un pago (BE-41, preseleccionado) o la compra de una devolución (CH-226)
    ...extrasDeAprobar(campos),
    ...(recordar && ofreceRecordar(campos) ? { recordarRegla: true } : {}),
  });

  // El traspaso de la lista (05 §4.15): se vuelve a aprobar y el servidor repite su mensaje o su confirmación
  const { id: movimientoId, origenId } = movimiento;
  const lineasDelServidor = useRef((movimiento.esperado as { lineas?: unknown }).lineas);
  const aprobarTraspaso = useCallback(
    () =>
      aprobarAhora({
        movimientoId,
        ...(origenId === undefined ? {} : { origenId }),
        // Un arrastre confirma o completa con la misma variante (CF-21), con las líneas que vio la lista
        ...(categoriaSoltada === undefined
          ? {}
          : { categoriaId: categoriaSoltada, esperado: { lineas: lineasDelServidor.current } }),
      }),
    [movimientoId, origenId, categoriaSoltada, aprobarAhora],
  );
  // Con un conflicto de las líneas no se aprueba solo: la persona primero ve el cambio (E6-5)
  useEffect(() => {
    if (traspaso && categoriaVista === undefined) void aprobarTraspaso();
  }, [traspaso, categoriaVista, aprobarTraspaso]);

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

  // Un SMS con error que se volvió a procesar trae otros valores (OP-49): el formulario parte de ellos
  const estadoPrevio = useRef(movimiento.estado);
  useEffect(() => {
    const antes = estadoPrevio.current;
    estadoPrevio.current = movimiento.estado;
    if (antes !== 'error' || movimiento.estado === 'error') return;
    formulario.reset(inicial);
    base.current = inicial;
    visto.current = movimiento.esperado;
  }, [movimiento.estado, movimiento.esperado, inicial, formulario]);

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
      <Suspense fallback={null}>
        <ResultadoDeAprobar marco={marco} valor={valor} siguienteId={siguienteId} />
      </Suspense>
    );
  }

  if (descartado) {
    const { comercio, monto } = movimiento.esperado;
    return (
      <PaginaFlujoDeRuta {...marco}>
        <Suspense fallback={null}>
          <Descartado
            movimientoId={movimiento.id}
            comercio={typeof comercio === 'string' ? comercio : null}
            monto={typeof monto === 'number' ? monto : null}
            siguienteId={siguienteId}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );
  }

  if (aprobar.estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta {...marco}>
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar.revisarImpacto}
            {...(aprobar.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            vista={vista}
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
  // Repartido del todo no dice nada: lo dice la suma de las líneas (S5). Falta o sobra sí.
  const ayuda =
    falta === undefined || falta === 0
      ? undefined
      : falta > 0
        ? g.faltaRepartir(formatearMonto(falta))
        : g.sobraRepartir;
  const totalValido = normalizarMontoEscrito(c.total).estado === 'valido';
  // [CH-240 E3-12, E3-13] Con datos faltantes o a mano, «Aprobar» queda deshabilitado con un solo motivo que los junta
  const motivoFaltan =
    aMano || movimiento.resumen.vista === 'faltaOtro' ? motivoFaltantes(c) : undefined;

  const salidas = (
    <Suspense fallback={null}>
      <Resolucion
        movimientoId={movimiento.id}
        estado={movimiento.estado}
        propio={propio}
        alDescartar={alDescartar}
        aprobando={enviando}
        {...(propio && sinLeer
          ? {
              alRegistrarAMano: () => {
                setAMano(true);
              },
            }
          : {})}
        {...(movimiento.reproceso === undefined ? {} : { reproceso: movimiento.reproceso })}
      />
    </Suspense>
  );

  if (propio)
    return (
      <PaginaFlujoDeRuta {...marco} acciones={salidas}>
        <div className="flex flex-col gap-5">
          <Suspense fallback={null}>
            <Encabezado resumen={movimiento.resumen} />
          </Suspense>
          <TextoDelSms texto={movimiento.sms} />
          <Suspense fallback={null}>
            <EstadoPropio estado={movimiento.estado} duplicado={movimiento.duplicado} />
          </Suspense>
          {movimiento.errorDetalle === undefined ? null : (
            <Suspense fallback={null}>
              <DetalleError errorDetalle={movimiento.errorDetalle} />
            </Suspense>
          )}
        </div>
      </PaginaFlujoDeRuta>
    );

  if (cuentas.length === 0)
    return (
      <PaginaFlujoDeRuta {...marco}>
        <Suspense fallback={null}>
          <SinCuentasDeMovimiento texto={movimiento.sms} />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  const motivoAprobar = aprobar.motivoSinEnvio ?? motivoFaltan;
  // «Aprobar $X» (o «Confirmar», que aprueba la coincidencia con OP-40) y, debajo, las salidas tonales
  const pie = (
    <div className="flex w-full flex-col gap-2 lg:ml-auto lg:w-[calc(50%-1rem)]">
      <Boton
        tipo="submit"
        form={ID_FORMULARIO}
        enviando={enviando}
        textoEnviando={conCoincidencia ? t.revisar.confirmando : t.revisar.aprobando}
        deshabilitado={!aprobar.enLinea || motivoFaltan !== undefined}
        className="w-full"
        {...(motivoAprobar === undefined ? {} : { motivoDeshabilitado: motivoAprobar })}
      >
        {conCoincidencia
          ? t.revisar.confirmarCoincidencia
          : totalValido
            ? t.revisar.aprobarMonto(formatearMontoTexto(c.total))
            : t.revisar.aprobar}
      </Boton>
      {salidas}
    </div>
  );

  return (
    <PaginaFlujoDeRuta {...marco} ancha acciones={pie}>
      <form
        id={ID_FORMULARIO}
        onSubmit={(e) => void alEnviar(conCoincidencia)(e)}
        noValidate
        className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8"
      >
        {/* [CH-240 E3-10] Computadora: a la izquierda lo que identifica al movimiento; a la derecha los campos y las acciones */}
        <div data-columna="identifica" className="flex flex-col gap-5 lg:sticky lg:top-6">
          <Suspense fallback={null}>
            <Encabezado resumen={movimiento.resumen} />
          </Suspense>
          {categoriaVista === undefined || categoriaSoltada === undefined ? null : (
            // [CH-240 E6-5] El valor visto, el actual y la categoría elegida, que no cambió, con la categoría ya puesta en la línea
            <AvisoEnLinea
              estado="advertencia"
              aparecioDespues
              titulo={t.revisar.conflictoArrastre.titulo}
              accion={
                <Boton
                  variante="secundaria"
                  deshabilitado={aprobarSolo.estado === 'enviando'}
                  onClick={() => void aprobarTraspaso()}
                >
                  {formularios.usarValorActual}
                </Boton>
              }
            >
              <p>
                {t.revisar.conflictoArrastre.cambio(
                  nombreCategoria(categorias, categoriaVista),
                  nombreCategoria(categorias, categoriaActual(lineasDelServidor.current)),
                )}
              </p>
              <p>
                {t.revisar.conflictoArrastre.elegido(nombreCategoria(categorias, categoriaSoltada))}
              </p>
            </AvisoEnLinea>
          )}
          <TextoDelSms texto={movimiento.sms} />
          {movimiento.coincidencia === undefined ? null : (
            <Suspense fallback={null}>
              <Coincidencia coincidencia={movimiento.coincidencia} />
            </Suspense>
          )}
          {movimiento.errorDetalle === undefined ? null : (
            <Suspense fallback={null}>
              <DetalleError errorDetalle={movimiento.errorDetalle} />
            </Suspense>
          )}
        </div>
        <div data-columna="campos" className="flex flex-col gap-5">
          {/* [CH-240 E3-13] Aprobando, los campos quedan de solo lectura */}
          <fieldset disabled={enviando} className="contents">
            <Suspense fallback={null}>
              <CamposMovimiento
                formulario={formulario}
                partes={partes}
                cuentas={cuentas}
                categorias={categorias}
                deudores={deudores}
                deLasPartes={deLasPartes}
                ayuda={ayuda}
                hoy={hoy}
                candidatas={candidatas}
                buscarCompras={buscarComprasDevolucion}
              />
            </Suspense>
          </fieldset>
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
          !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) &&
          !conflicto ? (
            <ErrorDeFlujo
              tipo="largo"
              error={fallo}
              alReintentar={() =>
                void [editar, aprobarSolo, coincide].find((o) => o.estado === 'error')?.reintentar()
              }
            />
          ) : null}
          {fallo !== undefined &&
          deLasPartes === undefined &&
          !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) &&
          conflicto ? (
            <AvisoEnLinea
              estado="problema"
              aparecioDespues
              accion={
                <Boton
                  variante="secundaria"
                  onClick={() => {
                    visto.current = { ...visto.current, ...fallo.datos };
                    editar.volverAEditar();
                  }}
                >
                  {formularios.usarValorActual}
                </Boton>
              }
            >
              {fallo.mensaje}
            </AvisoEnLinea>
          ) : null}
        </div>
      </form>
    </PaginaFlujoDeRuta>
  );
}
