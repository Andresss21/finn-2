'use client';
// `/registrar/gasto` (FT-21, OP-20; 05 §2.4): un gasto en efectivo o con tarjeta, repartido en una o varias partes, cada una con
// una categoría o por cobrar a una persona (existente o nueva). Es un flujo largo: siempre página completa (05 §1.4). Se guarda en un
// solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01. No calcula montos (PF-3): lo único
// que muestra por su cuenta es cuánto falta repartir, como ayuda visual (05 §5.1); la suma la valida el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { SeleccionNativa, type OpcionNativa } from '../../componentes/base/seleccion-nativa';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { faltaRepartir, normalizarMontoEscrito } from '../../formularios/normalizar-monto';
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
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

const ID_FORMULARIO = 'formulario-registrar-gasto';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Los rechazos de negocio que se muestran junto al campo de las partes (CA-21.5), no como aviso del formulario. */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
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
}: PropsFormularioRegistrarGasto) {
  const enviar: AccionEscritura = (payload) => registrarGasto(aEntradaDeAccion(payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(() => valoresIniciales(hoy, cuentaPropuesta), [hoy, cuentaPropuesta]);
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
    const tocadas = categorias.filter((x) =>
      c.lineas.some((l) => l.destino === 'categoria' && l.categoriaId === x.id),
    );
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
            lineas={c.lineas.map((l, i) => ({
              clave: partes.fields[i]?.id ?? String(i),
              destino: nombreDelDestino(l, categorias, deudores),
              monto: formatearMontoTexto(l.monto),
            }))}
            tocadas={tocadas}
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

  const guardar = (
    <Boton
      tipo="submit"
      form={ID_FORMULARIO}
      enviando={estado === 'enviando'}
      textoEnviando={t.guardando}
      deshabilitado={!operacion.enLinea}
      className="w-full"
      {...(operacion.motivoSinEnvio === undefined
        ? {}
        : { motivoDeshabilitado: operacion.motivoSinEnvio })}
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
            acciones: <div className="w-full md:ml-auto md:w-[calc(50%-1.125rem)]">{guardar}</div>,
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
          <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-9">
            <div className="flex flex-col gap-4.5 md:col-start-1 md:row-start-1">
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
            <div className="md:col-start-2 md:row-span-2 md:row-start-1">
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
            <div className="md:col-start-1 md:row-start-2">
              <EntradaTexto etiqueta={t.nota} autoComplete="off" {...formulario.register('nota')} />
            </div>
          </div>
          {estado === 'error' &&
          fallo !== undefined &&
          deLasPartes === undefined &&
          !enSuCampo(fallo) ? (
            <AvisoEnLinea
              estado="problema"
              aparecioDespues
              {...(REINTENTABLES.includes(fallo.categoria)
                ? {
                    accion: (
                      <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                        {formularios.intentarDeNuevo}
                      </Boton>
                    ),
                  }
                : {})}
            >
              {fallo.mensaje}
            </AvisoEnLinea>
          ) : null}
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
