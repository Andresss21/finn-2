'use client';
// `/cuentas/[cuentaId]/verificar-saldo` (FT-44, OP-53; 06 §3.2; 05 §2.7): escribir el saldo del banco a una fecha, ver la diferencia
// que dice el servidor, elegir qué marcar como conciliado y confirmar. Tres pasos sobre la misma operación: datos (previsualiza
// con todas las candidatas para traer la diferencia), marcar (todas preseleccionadas solo si la diferencia es exactamente cero, P6-5)
// y revisar (previsualiza con lo marcado y confirma). No calcula montos (PF-3).
import { Centavos, type FechaLocal } from '@finn/dominio/valores';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Monto } from '../../componentes/dominio/monto';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { CerrarFlujoAlMontar } from '../../componentes/navegacion/flujo-de-ruta';
import { useReemplazarBusqueda } from '../../componentes/navegacion/use-reemplazar-busqueda';
import { centavosATextoDecimal, formatearFecha, formatearMonto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { dominio } from '../../textos/dominio';
import { formularios } from '../../textos/formularios';
import { verificarSaldo as t } from '../../textos/verificar-saldo';
import { MarcoCorto } from '../cuentas-archivar/marco-corto';
import { rutaConResultado } from '../cuentas-resultado';
import { aEntradaDeAccion, contrato, type Campos, type Marcar } from './campos';

const BorradorVerificarSaldo = lazy(() => import('./borrador'));

export interface PropsFormularioVerificarSaldo {
  /** `verificarSaldo` (OP-53): la pone el lector, así el formulario se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly cuentaId: string;
  readonly cuenta: string;
  readonly tarjeta: boolean;
  readonly hoy: FechaLocal;
  /** La fecha con que abre: la de `?fecha=` o `hoy`. */
  readonly fecha: string;
  /** Todas las candidatas a esa fecha; `candidatas` trae las más recientes. */
  readonly cantidad: number;
  /** GLO-23: abierto como hoja o panel sobre el detalle (ruta interceptada). */
  readonly superpuesto?: boolean;
  readonly candidatas: readonly {
    readonly id: string;
    readonly comercio: string | null;
    readonly fecha: string;
    readonly monto: Centavos;
  }[];
}

interface Vista {
  readonly propuesta?: {
    readonly saldoFinn: Centavos;
    readonly diferencia: Centavos;
    readonly marcaria: number;
  };
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: Record<string, unknown>;
  }[];
  readonly rechazos?: readonly { readonly codigo: string }[];
}
type Paso = 'datos' | 'marcar' | 'revisar';
type Ajuste = NonNullable<Vista['avisos']>[number];

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const MENSAJES: Readonly<Record<string, string | undefined>> = t.rechazos;
/** La ruta del flujo que crea el ajuste de AV-21 (FD-06) según la operación que propone el servidor. */
const RUTA_AJUSTE: Readonly<Record<string, string | undefined>> = {
  'OP-20': 'gasto',
  'OP-21': 'ingreso',
  'OP-27': 'entrada-tarjeta',
};

const conSigno = (monto: Centavos): string => `${monto > 0 ? '+' : ''}${formatearMonto(monto)}`;

export function FormularioVerificarSaldo(p: PropsFormularioVerificarSaldo) {
  const { accion, cuentaId, cuenta, tarjeta, hoy, candidatas, superpuesto = false } = p;
  const rutaPadre = `/cuentas/${cuentaId}`;
  const reemplazarBusqueda = useReemplazarBusqueda();
  const enviar = useCallback<AccionEscritura>(
    (payload) => accion(aEntradaDeAccion(cuentaId, tarjeta, payload)),
    [accion, cuentaId, tarjeta],
  );
  const operacion = useOperacion({ accion: enviar, creacion: true, previsualizarPrimero: true });
  const [inicial] = useState<Campos>(() => ({ fecha: p.fecha, saldo: '', signo: 'positivo' }));
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const { setValue, formState, reset } = formulario;
  const c = formulario.watch();

  const [paso, setPaso] = useState<Paso>('datos');
  const [marcas, setMarcas] = useState<'todas' | ReadonlySet<string>>(new Set());
  const [rechazo, setRechazo] = useState<string>();
  const [ajuste, setAjuste] = useState<Ajuste>();
  const [base, setBase] = useState<Vista['propuesta']>();
  const siguiente = useRef<Paso | null>(null);
  /** Cuántas transacciones marca la verificación que se confirma: lo que dijo el servidor al revisar (PF-3). */
  const marcadas = useRef(0);
  const { estado, error: fallo, exito, previsualizacion } = operacion;
  const { volverAEditar } = operacion;

  // Al llegar una previsualización se pasa al paso que se pidió; un rechazo vuelve a editar con su mensaje.
  useEffect(() => {
    if (estado !== 'confirmando' || siguiente.current === null) return;
    const destino = siguiente.current;
    siguiente.current = null;
    const v = (previsualizacion ?? {}) as Vista;
    const primero = v.rechazos?.[0];
    if (primero !== undefined) {
      setRechazo(primero.codigo);
      volverAEditar();
      return;
    }
    setRechazo(undefined);
    if (destino === 'marcar') {
      setBase(v.propuesta);
      // Comparar con cero no es aritmética (06 §3.2.2, P6-5).
      setMarcas(v.propuesta?.diferencia === 0 ? 'todas' : new Set());
    }
    setAjuste(v.avisos?.find((a) => a.codigo === 'AV-21'));
    if (destino === 'revisar') marcadas.current = v.propuesta?.marcaria ?? 0;
    setPaso(destino);
  }, [estado, previsualizacion, volverAEditar]);

  const marcada = (id: string): boolean => marcas === 'todas' || marcas.has(id);
  const alternar = (id: string) => {
    const s = new Set(marcas === 'todas' ? candidatas.map((x) => x.id) : marcas);
    if (!s.delete(id)) s.add(id);
    setMarcas(s);
  };
  const volver = (a: Paso) => {
    setPaso(a);
    operacion.volverAEditar();
  };
  const verDiferencia = (e: React.SyntheticEvent) => {
    siguiente.current = 'marcar';
    void formulario.enviar(e);
  };
  const revisar = () => {
    siguiente.current = 'revisar';
    const marcar: Marcar = marcas === 'todas' ? 'todas' : [...marcas];
    void operacion.enviar({ ...c, marcar });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const vista = (previsualizacion ?? {}) as Vista;
  const fechaTexto = formatearFecha(c.fecha);
  // E2-14: en una tarjeta el servidor da el saldo con signo (deuda en negativo) y la pantalla lo dice como deuda: solo se muestra con el signo cambiado.
  const lineaFinn = (saldo: Centavos): string =>
    tarjeta
      ? t.deudaFinn(fechaTexto, formatearMonto(Centavos.negar(saldo)))
      : t.saldoFinn(fechaTexto, formatearMonto(saldo));

  if (estado === 'listo' && exito !== undefined) {
    const ruta = RUTA_AJUSTE[String(ajuste?.datos?.['operacion'])];
    const monto = ajuste?.datos?.['monto'] as Centavos | undefined;
    const texto =
      monto === undefined
        ? undefined
        : ajuste?.datos?.['operacion'] === 'OP-21'
          ? t.ajusteIngreso(formatearMonto(monto))
          : ajuste?.datos?.['operacion'] === 'OP-27'
            ? t.ajusteEntrada(formatearMonto(monto))
            : t.ajusteGasto(formatearMonto(monto));
    // Valores iniciales del alta (CH-212, FD-06): la cuenta, la fecha del estado, el monto y el comercio que fija el servidor
    const datos = ajuste?.datos;
    const valores = new URLSearchParams({
      cuenta: cuentaId,
      fecha: typeof datos?.['fechaEstado'] === 'string' ? datos['fechaEstado'] : c.fecha,
      ...(monto === undefined ? {} : { total: centavosATextoDecimal(monto) }),
      ...(typeof datos?.['comercio'] === 'string' ? { comercio: datos['comercio'] } : {}),
    }).toString();
    // E2-13: sin un paso siguiente (el ajuste de AV-21), el flujo se cierra y el resultado queda bajo las acciones del detalle.
    if (ruta === undefined || texto === undefined)
      return (
        <MarcoCorto superpuesto={superpuesto} titulo={t.tituloListo} rutaPadre={rutaPadre}>
          <CerrarFlujoAlMontar
            rutaPadre={rutaConResultado(rutaPadre, {
              tipo: 'verificado',
              fecha: c.fecha,
              marcadas: marcadas.current,
            })}
          />
        </MarcoCorto>
      );
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <Resultado texto={t.guardado(cuenta, fechaTexto)} />
          <AvisoEnLinea
            estado="advertencia"
            aparecioDespues
            accion={
              <EnlaceFinn
                href={`/registrar/${ruta}?${valores}`}
                className="inline-flex min-h-11 items-center font-bold text-enlace underline"
              >
                {t.crearAjuste}
              </EnlaceFinn>
            }
          >
            {texto}
          </AvisoEnLinea>
        </div>
      </MarcoCorto>
    );
  }

  if (paso === 'revisar' && estado !== 'editando') {
    const r = vista.propuesta;
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          {estado === 'error' && fallo !== undefined ? (
            <AvisoEnLinea estado="problema" aparecioDespues>
              {fallo.mensaje}
            </AvisoEnLinea>
          ) : null}
          <ConfirmacionImpacto
            titulo={t.tituloRevisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            impacto={
              r === undefined
                ? []
                : [
                    lineaFinn(r.saldoFinn),
                    t.diferencia(conSigno(r.diferencia)),
                    t.seMarcan(r.marcaria),
                  ]
            }
            avisos={[]}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={estado === 'enviando'}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={() => {
              volver('marcar');
            }}
          />
        </div>
      </MarcoCorto>
    );
  }

  if (paso === 'marcar' && base !== undefined) {
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <p data-saldo-finn>{lineaFinn(base.saldoFinn)}</p>
          <p data-diferencia className="font-bold">
            {t.diferencia(conSigno(base.diferencia))}
          </p>
          <AvisoEnLinea estado={base.diferencia === 0 ? 'positivo' : 'advertencia'}>
            {base.diferencia === 0 ? t.coincide : t.noCoincide}
          </AvisoEnLinea>
          {candidatas.length === 0 ? (
            <p>{t.sinCandidatas}</p>
          ) : (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-2 text-titulo-seccion">{t.marcar}</legend>
              {p.cantidad > candidatas.length ? (
                <p className="text-cuerpo-pequeno text-texto-secundario">
                  {t.mostrando(candidatas.length, p.cantidad)}
                </p>
              ) : null}
              {candidatas.map((x) => (
                <label
                  key={x.id}
                  className="flex min-h-11 items-center gap-3 rounded-contenedor bg-superficie px-3.5"
                >
                  <input
                    type="checkbox"
                    className="size-5 shrink-0"
                    checked={marcada(x.id)}
                    onChange={() => {
                      alternar(x.id);
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {x.comercio ?? dominio.sinComercio}
                    </span>
                    <span className="text-cuerpo-pequeno text-texto-secundario">
                      {formatearFecha(x.fecha)}
                    </span>
                  </span>
                  <Monto centavos={x.monto} rol="cifra" />
                </label>
              ))}
            </fieldset>
          )}
          {estado === 'error' && fallo !== undefined ? (
            <AvisoEnLinea estado="problema" aparecioDespues>
              {fallo.mensaje}
            </AvisoEnLinea>
          ) : null}
          {rechazo === undefined ? null : (
            <AvisoEnLinea estado="problema" aparecioDespues>
              {MENSAJES[rechazo] ?? t.rechazos.otro}
            </AvisoEnLinea>
          )}
          <div className="flex gap-3">
            <Boton enviando={estado === 'enviando'} textoEnviando={t.calculando} onClick={revisar}>
              {t.revisar}
            </Boton>
            <Boton
              variante="secundaria"
              onClick={() => {
                volver('datos');
              }}
            >
              {t.volverAEditar}
            </Boton>
          </div>
        </div>
      </MarcoCorto>
    );
  }

  return (
    <MarcoCorto superpuesto={superpuesto} titulo={t.titulo} rutaPadre={rutaPadre}>
      <form onSubmit={verDiferencia} noValidate className="flex flex-col gap-5">
        <Suspense fallback={null}>
          <BorradorVerificarSaldo
            campos={c}
            inicial={inicial}
            operacion={operacion}
            reset={reset}
          />
        </Suspense>
        <p>{t.cuenta(cuenta)}</p>
        <EntradaFecha
          nombre="fecha"
          etiqueta={t.fecha}
          valor={c.fecha as FechaLocal}
          alCambiar={(fecha) => {
            setValue('fecha', fecha, { shouldDirty: true, shouldValidate: formState.isSubmitted });
            if (fecha !== '') reemplazarBusqueda({ fecha });
          }}
          maxima={hoy}
          hoy={hoy}
          error={error('fecha')}
          requerido
        />
        <EntradaMonto
          nombre="saldo"
          etiqueta={tarjeta ? t.deudaBanco : t.saldoBanco}
          valor={c.saldo}
          alCambiar={(saldo) => {
            setValue('saldo', saldo, { shouldDirty: true, shouldValidate: formState.isSubmitted });
          }}
          {...(tarjeta
            ? {
                conSigno: true,
                signo: c.signo,
                alCambiarSigno: (signo: Campos['signo']) => {
                  setValue('signo', signo, { shouldDirty: true });
                },
                etiquetasSigno: { positivo: t.debo, negativo: t.tengoAFavor },
              }
            : {})}
          error={error('saldo')}
          requerido
        />
        <p>{t.candidatas(p.cantidad)}</p>
        {rechazo === undefined ? null : (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {MENSAJES[rechazo] ?? t.rechazos.otro}
          </AvisoEnLinea>
        )}
        {estado === 'error' && fallo !== undefined ? (
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
          textoEnviando={t.calculando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.verDiferencia}
        </Boton>
      </form>
    </MarcoCorto>
  );
}
