'use client';
// `/registrar/gasto` (FT-21, OP-20; 05 §2.4): un gasto en efectivo o con tarjeta. Es un flujo largo: siempre página completa (05 §1.4).
// Se guarda en un solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01. [CH-276, CH-277]
// Armado con los campos v3 (C-45 §4.8): el total como billete, los datos en un grupo, «¿Quién paga?» y «¿En qué categorías?»
// (C-49). Las líneas salen de esas dos secciones al guardar (`lineasDe`): una por categoría y una por cada persona; cada monto
// que la app propone se ve antes de guardar (PF-3 ampliado por CH-276) y el servidor sigue validando la suma.
import type { LimitesDeFecha } from '../../formularios/limites-de-fecha';
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { EntradaTexto, GrupoCampos } from '../../componentes/base/campo';
import { SeleccionFila, type OpcionFila } from '../../componentes/base/seleccion-fila';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarGasto } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import {
  aEntradaDeAccion,
  contratoDeRegistro,
  DEUDOR_NUEVO,
  deudoresReutilizados,
  motivoDeGuardar,
  textoDeAviso,
  valoresIniciales,
  type CamposDeRegistro,
} from './campos';
import { Categorias, type CategoriaDelCampo } from './categorias';
import { estadoDelGasto, lineasDe, NUEVA, type Marcas } from './estado';
import { QuienPaga } from './quien-paga';

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
  /** [CH-260] Los límites de la fecha que da el servidor; sin ellos, hasta hoy. */
  readonly limites?: LimitesDeFecha;
  readonly cuentas: readonly CuentaDelCampo[];
  readonly categorias: readonly CategoriaDelCampo[];
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
/** Los rechazos de negocio que se muestran junto al resumen de las categorías (CA-21.5, CA-R-15). */
const DE_LAS_PARTES = ['suma_lineas_distinta', 'linea_sin_destino'];
const SIN_MARCAS: Marcas = { personas: false, categorias: false, enviado: false };
/** Un rechazo cuyo mensaje ya se muestra en un campo de datos no se repite; los de las líneas no tienen campo propio. */
const enSuCampo = (e: ErrorFinn): boolean =>
  Object.entries(e.campos ?? {}).some(([ruta, m]) => !ruta.startsWith('lineas') && m === e.mensaje);

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);
const SinCuentas = lazy(() => import('./sin-cuentas'));
const ResultadoGasto = lazy(() => import('./resultado-gasto'));
const BorradorGasto = lazy(() => import('./borrador-gasto'));
const SugerenciaComercio = lazy(() => import('./sugerencia-comercio'));

const aOpciones = (xs: readonly CuentaDelCampo[]): OpcionFila[] =>
  xs.map((x) => ({ valor: x.id, etiqueta: x.nombre, detalle: x.detalle }));

export function FormularioRegistrarGasto({
  hoy,
  limites,
  cuentas,
  categorias,
  deudores,
  cuentaPropuesta,
  desdeUrl = SIN_VALORES,
}: PropsFormularioRegistrarGasto) {
  const enviar: AccionEscritura = (payload) => registrarGasto(aEntradaDeAccion(payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(
    () => valoresIniciales(limites?.inicial ?? hoy, cuentaPropuesta, desdeUrl),
    [hoy, limites, cuentaPropuesta, desdeUrl],
  );
  const formulario = useFormularioFinn<CamposDeRegistro>({
    contrato: contratoDeRegistro,
    valoresIniciales: inicial,
    operacion,
  });
  const { setValue, getValues, formState, reset } = formulario;
  const c = formulario.watch();
  const [marcas, setMarcas] = useState<Marcas>(SIN_MARCAS);
  const [anuncio, setAnuncio] = useState('');
  const raiz = useRef<HTMLFormElement>(null);
  const e = estadoDelGasto(c, marcas);

  const poner = (nombre: Parameters<typeof setValue>[0]) => (valor: string) => {
    setValue(nombre, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  /** Las secciones cambian varios campos juntos. */
  const ponerVarios = (parcial: Partial<CamposDeRegistro>) => {
    for (const [k, v] of Object.entries(parcial))
      setValue(k as keyof CamposDeRegistro, v as never, { shouldDirty: true });
  };
  const usarSugerencia = useCallback(
    (categoria: Referencia) => {
      const filas = getValues('filas');
      const [primera, ...resto] = filas;
      // C-49 §1: llena «Una» (o la primera fila) solo si está vacía; nunca cambia una elegida
      if (
        primera !== undefined &&
        primera.categoriaId === '' &&
        !filas.some((f) => f.categoriaId === categoria.id)
      )
        setValue('filas', [{ ...primera, categoriaId: categoria.id }, ...resto], {
          shouldDirty: true,
        });
    },
    [getValues, setValue],
  );
  const error = (n: 'cuentaId' | 'fecha' | 'total'): string | undefined =>
    formState.errors[n]?.message;

  const { estado, error: fallo, exito } = operacion;
  // [CH-240 E3-18] «Guardar» espera a que se corrija la fecha
  const [errorFecha, setErrorFecha] = useState<string | undefined>(undefined);
  // [CH-240 E6-21] Con `suma_lineas_distinta`, «Guardar» dice por qué hasta que cambien las partes o el total
  const huellaPartes = JSON.stringify([c.total, c.vos, c.personas, c.filas, c.varias]);
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

  if (cuentas.length === 0)
    return (
      <PaginaFlujoDeRuta titulo={t.tituloGasto} rutaPadre="/registrar">
        <Suspense fallback={null}>
          <SinCuentas />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  const nombreDeCategoria = (id: string) => categorias.find((x) => x.id === id)?.nombre ?? '';
  const nombreDePersona = (l: CamposDeRegistro['lineas'][number]) =>
    l.deudorId === DEUDOR_NUEVO
      ? l.deudorNuevo
      : (deudores.find((x) => x.id === l.deudorId)?.nombre ?? '');

  if (estado === 'listo' && exito !== undefined) {
    const nombreDeCuenta = cuentas.find((x) => x.id === c.cuentaId)?.nombre ?? '';
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
              clave: String(i),
              nombre:
                l.destino === 'categoria'
                  ? nombreDeCategoria(l.categoriaId)
                  : t.teDebe(nombreDePersona(l)),
              href:
                l.destino === 'categoria'
                  ? `/presupuesto/categorias/${l.categoriaId}`
                  : '/por-cobrar',
              verTexto: l.destino === 'categoria' ? t.verLaCategoria : t.verEnPorCobrar,
              monto: formatearMontoTexto(l.monto),
            }))}
            reutilizados={deudoresReutilizados(c, deudores)}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );
  }

  const deLasPartes =
    estado === 'error' && fallo !== undefined && DE_LAS_PARTES.includes(fallo.codigo)
      ? fallo.mensaje
      : undefined;
  const motivoGuardar =
    motivoDeGuardar({
      sinConexion: operacion.motivoSinEnvio,
      fechaConError: errorFecha !== undefined,
      textoFecha: t.corregiFecha,
      sumaRechazada:
        sumaRechazada?.huella === huellaPartes ? sumaRechazada.rechazo.mensaje : undefined,
    }) ?? e.motivo;

  // CA-K3-13: sin todo listo no se envía; se marcan los errores y el foco va al primero (en el cuadro siguiente, ya dibujados)
  const alEnviar = (ev: FormEvent<HTMLFormElement>) => {
    if (!e.listo || errorFecha !== undefined) {
      ev.preventDefault();
      setMarcas({ personas: true, categorias: true, enviado: true });
      requestAnimationFrame(() => {
        raiz.current
          ?.querySelector<HTMLElement>(
            '[aria-invalid="true"], [data-error] [aria-haspopup="listbox"], [data-estado="error"]',
          )
          ?.focus();
      });
      return;
    }
    setValue('lineas', lineasDe(c, e));
    void formulario.enviar(ev);
  };
  const guardar = (
    <Boton
      tipo="submit"
      form={ID_FORMULARIO}
      enviando={estado === 'enviando'}
      textoEnviando={t.guardando}
      deshabilitado={!operacion.enLinea}
      apagado={motivoGuardar !== undefined}
      className="w-full"
      {...(motivoGuardar === undefined ? {} : { motivoDeshabilitado: motivoGuardar })}
    >
      {e.total > 0 ? t.guardarMonto(formatearMontoTexto(c.total)) : t.guardar}
    </Boton>
  );
  const unaSola = c.personas.length === 1 ? c.personas[0]?.clave : undefined;
  const marcar = (k: 'personas' | 'categorias') => () => {
    if (!marcas[k]) setMarcas({ ...marcas, [k]: true });
  };

  return (
    <PaginaFlujoDeRuta
      titulo={t.tituloGasto}
      rutaPadre="/registrar"
      ancha
      {...(estado === 'confirmando'
        ? {}
        : {
            acciones: (
              // [CH-240 E6-18, E6-21] La barra fija queda a 20 px de los bordes: los del pie de `PaginaFlujo`, sin relleno extra
              <div className="w-full xl:ml-auto xl:w-[calc(50%-1.125rem)]">{guardar}</div>
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
          ref={raiz}
          id={ID_FORMULARIO}
          onSubmit={alEnviar}
          noValidate
          className="flex flex-col gap-6"
        >
          <Suspense fallback={null}>
            <BorradorGasto campos={c} inicial={inicial} operacion={operacion} reset={reset} />
          </Suspense>
          <p role="status" className="sr-only">
            {anuncio}
          </p>
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-9">
            <div className="flex flex-col gap-5 xl:col-start-1 xl:row-start-1">
              <EntradaMonto
                nombre="total"
                etiqueta={t.totalV3}
                variante="total"
                valor={c.total}
                alCambiar={poner('total')}
                error={e.errorTotal ?? error('total')}
                requerido
              />
              <GrupoCampos>
                <SeleccionFila
                  etiqueta={t.cuentaV3}
                  marcador={t.elegirCuenta}
                  opciones={aOpciones(cuentas)}
                  valor={c.cuentaId}
                  alCambiar={poner('cuentaId')}
                  error={error('cuentaId')}
                  {...(cuentaPropuesta !== undefined && c.cuentaId === cuentaPropuesta
                    ? { descripcion: t.cuentaPropuesta }
                    : {})}
                />
                <EntradaFecha
                  nombre="fecha"
                  etiqueta={t.fecha}
                  valor={c.fecha as FechaLocal}
                  alCambiar={poner('fecha')}
                  error={error('fecha')}
                  requerido
                  sinVistaPrevia
                  minima={limites?.minima}
                  maxima={limites?.maxima ?? hoy}
                  hoy={hoy}
                  alCambiarMensaje={setErrorFecha}
                />
                <EntradaTexto
                  etiqueta={t.comercio}
                  autoComplete="off"
                  {...formulario.register('comercio')}
                />
              </GrupoCampos>
              {c.comercio.trim().length >= 2 ? (
                <Suspense fallback={null}>
                  <SugerenciaComercio comercio={c.comercio} alUsar={usarSugerencia} />
                </Suspense>
              ) : null}
            </div>
            <div
              className="flex flex-col gap-6 xl:col-start-2 xl:row-span-2 xl:row-start-1"
              data-campo-lineas
            >
              <QuienPaga
                c={c}
                e={e}
                conocidas={deudores.map((d) => ({ clave: d.id, nombre: d.nombre }))}
                destinoDeVos={
                  c.varias && c.filas.length > 1
                    ? t.nCategorias(c.filas.length)
                    : nombreDeCategoria(c.filas[0]?.categoriaId ?? '') || t.elegiUnaCategoria
                }
                poner={ponerVarios}
                alSalir={marcar('personas')}
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
                poner={ponerVarios}
                alSalir={marcar('categorias')}
                anunciar={setAnuncio}
              />
            </div>
            <div className="xl:col-start-1 xl:row-start-2">
              <GrupoCampos>
                <EntradaTexto
                  etiqueta={t.nota}
                  autoComplete="off"
                  {...formulario.register('nota')}
                />
              </GrupoCampos>
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
