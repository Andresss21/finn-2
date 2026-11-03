'use client';
// `/registrar/gasto` (FT-21, OP-20; 05 §2.4): un gasto en efectivo o con tarjeta, repartido en una o varias partes, cada una con
// una categoría o por cobrar a una persona (existente o nueva). Es un flujo largo: siempre página completa (05 §1.4). Se guarda en un
// solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01. No calcula montos (PF-3): lo único
// que muestra por su cuenta es cuánto falta repartir, como ayuda visual (05 §5.1); la suma la valida el servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto } from '../../componentes/base/campo';
import { Seleccion, type Opcion } from '../../componentes/base/seleccion';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { faltaRepartir } from '../../formularios/normalizar-monto';
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
  MAXIMO_PARTES,
  parteVacia,
  valoresIniciales,
  type Campos,
  type DestinoDeParte,
} from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export interface PropsFormularioRegistrarGasto {
  readonly hoy: FechaLocal;
  readonly cuentas: readonly Referencia[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  readonly cuentaPropuesta: string | undefined;
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: Centavos } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Los rechazos de negocio que se muestran junto al campo de las partes (CA-21.5), no como aviso del formulario. */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
    default: m.ConfirmacionImpacto,
  })),
);
const SinCuentas = lazy(() => import('./sin-cuentas'));
const ResultadoGasto = lazy(() => import('./resultado-gasto'));
const BorradorGasto = lazy(() => import('./borrador-gasto'));
// La parte se carga aparte: el HTML del servidor ya la trae y el presupuesto de bytes de la ruta no la cuenta (05 §13.1)
const CampoLineas = lazy(() =>
  import('../../componentes/formularios/campo-lineas').then((m) => ({ default: m.CampoLineas })),
);
const ParteDeGasto = lazy(() => import('./parte').then((m) => ({ default: m.ParteDeGasto })));
const SugerenciaComercio = lazy(() => import('./sugerencia-comercio'));

const aOpciones = (xs: readonly Referencia[]): Opcion[] =>
  xs.map((x) => ({ valor: x.id, etiqueta: x.nombre }));

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
  const conError = (mensaje: string | undefined): { error?: string } =>
    mensaje === undefined ? {} : { error: mensaje };

  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;
  const opcionesCuentas = aOpciones(cuentas);
  const opcionesCategorias = aOpciones(categorias);
  const opcionesDeudores: Opcion[] = [
    ...aOpciones(deudores),
    { valor: DEUDOR_NUEVO, etiqueta: t.otraPersona },
  ];

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
  const ayuda =
    falta === undefined
      ? undefined
      : falta > 0
        ? t.faltaRepartir(formatearMonto(falta))
        : falta < 0
          ? t.sobraRepartir
          : t.todoRepartido;
  const deLasPartes =
    estado === 'error' && fallo !== undefined && DE_LAS_PARTES.includes(fallo.codigo)
      ? fallo.mensaje
      : undefined;
  const errorDeLasPartes = deLasPartes ?? formState.errors.lineas?.message;

  const cambiarDestino = (i: number, destino: DestinoDeParte) => {
    poner(`lineas.${i}.destino`)(destino);
    poner(`lineas.${i}.deudorId`)(
      destino === 'por_cobrar' && deudores.length === 0 ? DEUDOR_NUEVO : '',
    );
  };

  return (
    <PaginaFlujoDeRuta titulo={t.tituloGasto} rutaPadre="/registrar">
      {estado === 'confirmando' ? (
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            impacto={
              vista.impacto
                ? [
                    t.impactoLpa(
                      `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa)}`,
                    ),
                  ]
                : []
            }
            avisos={(vista.avisos ?? []).map((a) =>
              a.codigo === 'AV-01' ? t.avisoPeriodoCerrado : a.codigo,
            )}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      ) : (
        <form
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <Suspense fallback={null}>
            <BorradorGasto campos={c} inicial={inicial} operacion={operacion} reset={reset} />
          </Suspense>
          <Seleccion
            etiqueta={t.cuenta}
            opciones={opcionesCuentas}
            valor={c.cuentaId}
            alCambiar={poner('cuentaId')}
            {...conError(error('cuentaId'))}
          />
          <EntradaFecha
            nombre="fecha"
            etiqueta={t.fecha}
            valor={c.fecha as FechaLocal}
            alCambiar={poner('fecha')}
            error={error('fecha')}
            requerido
          />
          <EntradaMonto
            nombre="total"
            etiqueta={t.total}
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
          />
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
          <EntradaTexto etiqueta={t.nota} autoComplete="off" {...formulario.register('nota')} />
          <Suspense fallback={null}>
            <CampoLineas
              etiqueta={t.partes}
              claves={partes.fields.map((f) => f.id)}
              maximo={MAXIMO_PARTES}
              textoAgregar={t.agregarParte}
              textoParte={t.parte}
              textoQuitar={t.quitarParte}
              textoCantidad={t.cantidadPartes}
              alAgregar={() => {
                partes.append(parteVacia());
              }}
              alQuitar={(i) => {
                partes.remove(i);
              }}
              ayuda={ayuda}
              error={errorDeLasPartes}
              renderParte={(i) => {
                const parte = c.lineas[i];
                if (parte === undefined) return null;
                return (
                  <Suspense fallback={null}>
                    <ParteDeGasto
                      i={i}
                      parte={parte}
                      categorias={opcionesCategorias}
                      deudores={opcionesDeudores}
                      error={(campo) => errorDeParte(i, campo)}
                      poner={poner}
                      alCambiarDestino={(d) => {
                        cambiarDestino(i, d);
                      }}
                      registroDeudorNuevo={formulario.register(`lineas.${i}.deudorNuevo`)}
                    />
                  </Suspense>
                );
              }}
            />
          </Suspense>
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
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={t.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {t.guardar}
          </Boton>
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
