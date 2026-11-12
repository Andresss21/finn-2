'use client';
// `/registrar/gasto` (FT-21, OP-20; 05 §2.4): un gasto en efectivo o con tarjeta, repartido en una o varias partes, cada una con
// una categoría o por cobrar a una persona (existente o nueva). Es un flujo largo: siempre página completa (05 §1.4). Se guarda en un
// solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01. No calcula montos (PF-3): lo único
// que muestra por su cuenta es cuánto falta repartir, como ayuda visual (05 §5.1); la suma la valida el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto, MensajeError } from '../../componentes/base/campo';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { faltaRepartir, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarGasto } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import {
  aEntradaDeAccion,
  contrato,
  DEUDOR_NUEVO,
  deudoresReutilizados,
  motivoDeGuardar,
  parteVacia,
  textoDeAviso,
  valoresIniciales,
  type Campos,
} from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

/** Una cuenta del campo: el detalle es «Deuda $642.18» o el saldo, ya formateado desde el DTO (S5). */
interface CuentaDelCampo extends Referencia {
  readonly tipo: 'efectivo' | 'tarjeta';
  readonly detalle: string;
}

export interface PropsFormularioRegistrarGasto {
  readonly hoy: FechaLocal;
  readonly cuentas: readonly CuentaDelCampo[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  readonly cuentaPropuesta: string | undefined;
  /** `?fecha=`, `?total=` y `?comercio=` de la propuesta de ajuste de AV-21 (CH-212). */
  readonly desdeUrl?: ValoresDeUrl;
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

const SIN_VALORES: ValoresDeUrl = {};
const ID_FORMULARIO = 'formulario-registrar-gasto';
/** Los rechazos de negocio que se muestran junto al campo de las partes (CA-21.5), no como aviso del formulario. */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);
const SinCuentas = lazy(() => import('./sin-cuentas'));
const ResultadoGasto = lazy(() => import('./resultado-gasto'));
const BorradorGasto = lazy(() => import('./borrador-gasto'));
// Las líneas se cargan aparte: el HTML del servidor ya las trae y el presupuesto de bytes de la ruta no las cuenta (05 §13.1)
const LineasDeGasto = lazy(() => import('./lineas'));
const SugerenciaComercio = lazy(() => import('./sugerencia-comercio'));

/** A quién o a qué categoría fue una línea, para el resultado: el nombre escrito si es una persona nueva. */
const nombreDelDestino = (
  l: Campos['lineas'][number],
  categorias: readonly Referencia[],
  deudores: readonly Referencia[],
): string =>
  l.destino === 'categoria'
    ? (categorias.find((x) => x.id === l.categoriaId)?.nombre ?? '')
    : l.deudorId === DEUDOR_NUEVO
      ? l.deudorNuevo.trim()
      : (deudores.find((x) => x.id === l.deudorId)?.nombre ?? '');

const aOpciones = (xs: readonly CuentaDelCampo[]): OpcionNativa[] =>
  xs.map((x) => ({
    valor: x.id,
    etiqueta: x.nombre,
    detalle: x.detalle,
    icono: x.tipo === 'tarjeta' ? 'card' : 'wallet',
  }));

export function FormularioRegistrarGasto({
  hoy,
  cuentas,
  categorias,
  deudores,
  cuentaPropuesta,
  desdeUrl = SIN_VALORES,
}: PropsFormularioRegistrarGasto) {
  const enviar: AccionEscritura = (payload) => registrarGasto(aEntradaDeAccion(payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(
    () => valoresIniciales(hoy, cuentaPropuesta, desdeUrl),
    [hoy, cuentaPropuesta, desdeUrl],
  );
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const { setValue, formState, control, reset } = formulario;
  const partes = useFieldArray({ control, name: 'lineas' });
  const c = formulario.watch();

  const poner = (nombre: Parameters<typeof setValue>[0]) => (valor: string) => {
    setValue(nombre, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: 'cuentaId' | 'fecha' | 'total'): string | undefined =>
    formState.errors[n]?.message;
  const errorDeParte = (
    i: number,
    n: 'monto' | 'categoriaId' | 'deudorId' | 'deudorNuevo',
  ): string | undefined => formState.errors.lineas?.[i]?.[n]?.message;

  const { estado, error: fallo, exito } = operacion;
  // [CH-240 E3-18] El error de la fecha va a lo ancho de la fila Fecha · Total y «Guardar» espera a que se corrija
  const [errorFecha, setErrorFecha] = useState<string | undefined>(undefined);
  const idErrorFecha = useId();
  // [CH-240 E6-21] Con `suma_lineas_distinta`, «Guardar» dice por qué hasta que cambien las partes o el total
  const huellaPartes = JSON.stringify([c.total, c.lineas]);
  const [sumaRechazada, setSumaRechazada] = useState<{
    readonly rechazo: ErrorFinn;
    readonly huella: string;
  }>();
  // Se actualiza al llegar un rechazo nuevo (ajuste del estado durante el render, como `EntradaFecha`): no es un efecto
  if (
    estado === 'error' &&
    fallo?.codigo === 'suma_lineas_distinta' &&
    sumaRechazada?.rechazo !== fallo
  )
    setSumaRechazada({ rechazo: fallo, huella: huellaPartes });
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;
  const opcionesCuentas = aOpciones(cuentas);

  if (cuentas.length === 0)
    return (
      <PaginaFlujoDeRuta titulo={t.tituloGasto} rutaPadre="/registrar">
        <Suspense fallback={null}>
          <SinCuentas />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  if (estado === 'listo' && exito !== undefined) {
    const nombreDeCuenta = cuentas.find((x) => x.id === c.cuentaId)?.nombre ?? '';
    const reutilizados = deudoresReutilizados(c, deudores);
    return (
      <PaginaFlujoDeRuta titulo={t.listo} rutaPadre="/registrar">
        <Suspense fallback={null}>
          <ResultadoGasto
            texto={t.guardado(
              c.comercio.trim() === '' ? t.sinComercio : c.comercio.trim(),
              formatearMontoTexto(c.total),
              nombreDeCuenta,
              String(c.lineas.length),
            )}
            transaccionId={(exito.valor as { id: string }).id}
            partes={c.lineas.map((l, i) => ({
              clave: partes.fields[i]?.id ?? String(i),
              nombre:
                l.destino === 'categoria'
                  ? nombreDelDestino(l, categorias, deudores)
                  : t.teDebe(nombreDelDestino(l, categorias, deudores)),
              href:
                l.destino === 'categoria'
                  ? `/presupuesto/categorias/${l.categoriaId}`
                  : '/por-cobrar',
              verTexto: l.destino === 'categoria' ? t.verLaCategoria : t.verEnPorCobrar,
              monto: formatearMontoTexto(l.monto),
            }))}
            reutilizados={reutilizados}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );
  }

  const falta: Centavos | undefined = faltaRepartir(
    c.total,
    c.lineas.map((l) => l.monto),
  );
  // Repartido del todo no dice nada: lo dice la suma de las líneas (S5). Falta o sobra sí.
  const ayuda =
    falta === undefined || falta === 0
      ? undefined
      : falta > 0
        ? t.faltaRepartir(formatearMonto(falta))
        : t.sobraRepartir;
  const deLasPartes =
    estado === 'error' && fallo !== undefined && DE_LAS_PARTES.includes(fallo.codigo)
      ? fallo.mensaje
      : undefined;
  const errorDeLasPartes = deLasPartes ?? formState.errors.lineas?.message;

  const totalValido = normalizarMontoEscrito(c.total).estado === 'valido';

  const motivoGuardar = motivoDeGuardar({
    sinConexion: operacion.motivoSinEnvio,
    fechaConError: errorFecha !== undefined,
    textoFecha: t.corregiFecha,
    sumaRechazada:
      sumaRechazada?.huella === huellaPartes ? sumaRechazada.rechazo.mensaje : undefined,
  });
  const guardar = (
    <Boton
      tipo="submit"
      form={ID_FORMULARIO}
      enviando={estado === 'enviando'}
      textoEnviando={t.guardando}
      deshabilitado={!operacion.enLinea || motivoGuardar !== undefined}
      className="w-full"
      {...(motivoGuardar === undefined ? {} : { motivoDeshabilitado: motivoGuardar })}
    >
      {totalValido ? t.guardarMonto(formatearMontoTexto(c.total)) : t.guardar}
    </Boton>
  );

  return (
    <PaginaFlujoDeRuta
      titulo={t.tituloGasto}
      rutaPadre="/registrar"
      ancha
      {...(estado === 'confirmando'
        ? {}
        : {
            acciones: (
              // [CH-240 E6-21] La barra fija queda a 20 px de los bordes (16 del marco más 4)
              <div className="w-full max-md:px-1 xl:ml-auto xl:w-[calc(50%-1.125rem)]">
                {guardar}
              </div>
            ),
          })}
    >
      {estado === 'confirmando' ? (
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            vista={vista}
            avisos={(vista.avisos ?? []).map((a) => textoDeAviso(a.codigo))}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      ) : (
        <form
          id={ID_FORMULARIO}
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-6"
        >
          <Suspense fallback={null}>
            <BorradorGasto campos={c} inicial={inicial} operacion={operacion} reset={reset} />
          </Suspense>
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-9">
            <div className="flex flex-col gap-4.5 xl:col-start-1 xl:row-start-1">
              <SeleccionNativa
                etiqueta={t.cuenta}
                alta
                marcador={t.elegirCuenta}
                opciones={opcionesCuentas}
                valor={c.cuentaId}
                alCambiar={poner('cuentaId')}
                error={error('cuentaId')}
              />
              <div className="grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
                <EntradaFecha
                  nombre="fecha"
                  etiqueta={t.fecha}
                  valor={c.fecha as FechaLocal}
                  alCambiar={poner('fecha')}
                  error={error('fecha')}
                  requerido
                  sinVistaPrevia
                  hoy={hoy}
                  mensajeEnFila={{ id: idErrorFecha, alCambiar: setErrorFecha }}
                />
                <EntradaMonto
                  nombre="total"
                  etiqueta={t.total}
                  valor={c.total}
                  alCambiar={poner('total')}
                  error={error('total')}
                  requerido
                  prefijo="$"
                  sinVistaPrevia
                />
                {errorFecha === undefined ? null : (
                  <div id={idErrorFecha} className="col-span-2">
                    <MensajeError>{errorFecha}</MensajeError>
                  </div>
                )}
              </div>
              <EntradaTexto
                etiqueta={t.comercio}
                autoComplete="off"
                {...formulario.register('comercio')}
              />
              {c.comercio.trim().length >= 2 ? (
                <Suspense fallback={null}>
                  <SugerenciaComercio
                    comercio={c.comercio}
                    alUsar={(categoria) => {
                      poner('lineas.0.destino')('categoria');
                      poner('lineas.0.categoriaId')(categoria.id);
                    }}
                  />
                </Suspense>
              ) : null}
            </div>
            <div className="xl:col-start-2 xl:row-span-2 xl:row-start-1">
              <Suspense fallback={null}>
                <LineasDeGasto
                  lineas={c.lineas}
                  claves={partes.fields.map((f) => f.id)}
                  categorias={categorias}
                  deudores={deudores}
                  total={c.total}
                  error={errorDeParte}
                  errorDeLasPartes={errorDeLasPartes}
                  ayuda={ayuda}
                  poner={poner}
                  registroDeudorNuevo={(i) => formulario.register(`lineas.${i}.deudorNuevo`)}
                  alAgregar={() => {
                    partes.append(parteVacia());
                  }}
                  alQuitar={(i) => {
                    partes.remove(i);
                  }}
                />
              </Suspense>
            </div>
            <div className="xl:col-start-1 xl:row-start-2">
              <EntradaTexto etiqueta={t.nota} autoComplete="off" {...formulario.register('nota')} />
            </div>
          </div>
          {estado === 'error' &&
          fallo !== undefined &&
          deLasPartes === undefined &&
          !enSuCampo(fallo) ? (
            <ErrorDeFlujo
              tipo="largo"
              error={fallo}
              alReintentar={() => void operacion.reintentar()}
            />
          ) : null}
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
