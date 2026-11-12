'use client';
// `/registrar/entrada-tarjeta`, `/registrar/avance` y `/registrar/transferencia-deuda` (FT-32, OP-27 a, b y c; 05 §2.4): los flujos
// cortos de los movimientos de tarjeta que no son compras. La entrada y el avance se guardan en un solo viaje (05 §4.4); la
// transferencia de deuda pide primero la previsualización porque AV-24 (el cambio en «te falta reservar» de las dos tarjetas) trae
// sus valores en el aviso. No calcula montos (PF-3): todo lo que muestra lo trae el servidor.
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { NotaFija } from './nota-fija';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { Vacio } from '../../componentes/base/vacio';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { useIrA } from '../../componentes/navegacion/use-ir-a';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import type { ValoresDeUrl } from '../../formularios/valores-de-url';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarMovimientoTarjeta } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarTarjeta as t } from '../../textos/registrar-tarjeta';
import { registrarTipo as c0 } from '../../textos/registrar-tipo';
import {
  aEntradaDeAccion,
  contratoDe,
  valoresIniciales,
  type Campos,
  type TipoDeTarjeta,
} from './campos-tarjeta';
import { recordarAvance } from '../registrar/avance-guardado';
import { ENLACE, Marco, REINTENTABLES, enSuCampo } from './formulario';

type Cuenta = { readonly id: string; readonly nombre: string };
const SIN_VALORES: ValoresDeUrl = {};

export interface PropsFormularioRegistrarTarjeta {
  readonly tipo: TipoDeTarjeta;
  readonly hoy: FechaLocal;
  readonly tarjetas: readonly Cuenta[];
  readonly efectivo: readonly Cuenta[];
  readonly tarjetaPropuesta: string | undefined;
  /** Valores iniciales que deja la propuesta de ajuste de la conciliación (AV-21, FD-06); solo la entrada a una tarjeta. */
  readonly desdeUrl?: ValoresDeUrl;
  /** Interceptado sobre la pantalla de origen (05 §1.4): hoja o panel; sin él, página completa. */
  readonly superpuesto?: boolean;
}

/** Lo que trae AV-24 en `datos` (01 §5.0.7): ya calculado por el servidor. */
type DatosAv24 = Readonly<
  Record<'origenId' | 'destinoId', string> &
    Record<'origenAntes' | 'origenDespues' | 'destinoAntes' | 'destinoDespues', number>
>;

export function FormularioRegistrarTarjeta({
  tipo,
  hoy,
  tarjetas,
  efectivo,
  tarjetaPropuesta,
  desdeUrl = SIN_VALORES,
  superpuesto = false,
}: PropsFormularioRegistrarTarjeta) {
  const comercio = tipo === 'entrada-tarjeta' ? desdeUrl.comercio : undefined;
  const esAvance = tipo === 'avance';
  const esDeuda = tipo === 'transferencia-deuda';
  const { titulo, listo, guardar } = t.flujos[tipo];
  const enviar: AccionEscritura = (payload) =>
    registrarMovimientoTarjeta(aEntradaDeAccion(tipo, payload, comercio));
  const operacion = useOperacion({ accion: enviar, creacion: true, previsualizarPrimero: esDeuda });
  const inicial = useMemo(
    () => valoresIniciales(hoy, tarjetaPropuesta, desdeUrl),
    [hoy, tarjetaPropuesta, desdeUrl],
  );
  const contrato = useMemo(() => contratoDe(tipo), [tipo]);
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
  const [cambios, setCambios] = useState<readonly string[]>([]);
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (n: keyof Campos) => (valor: string) => {
    setValue(n, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const conError = (n: keyof Campos): { error?: string } => {
    const mensaje = error(n);
    return mensaje === undefined ? {} : { error: mensaje };
  };
  const opciones = (l: readonly Cuenta[]) => l.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
  const nombreDe = (id: string): string =>
    [...tarjetas, ...efectivo].find((x) => x.id === id)?.nombre ?? '';

  const selecciones: readonly {
    campo: keyof Campos;
    etiqueta: string;
    lista: readonly Cuenta[];
  }[] = [
    {
      campo: 'tarjetaId',
      etiqueta: esDeuda ? t.tarjetaOrigen : esAvance ? t.tarjetaAvance : t.tarjetaEntrada,
      lista: tarjetas,
    },
    ...(esAvance
      ? [{ campo: 'cuentaId' as const, etiqueta: t.cuentaAvance, lista: efectivo }]
      : []),
    ...(esDeuda
      ? [{ campo: 'tarjetaDestinoId' as const, etiqueta: t.tarjetaDestino, lista: tarjetas }]
      : []),
  ];

  const { estado, error: fallo, exito } = operacion;
  const irA = useIrA();
  const ruta = usePathname();
  // [CH-240 E3-22] Un avance guardado cierra la hoja y deja el resultado arriba del selector de Registrar
  const avanceGuardado = esAvance && estado === 'listo' && exito !== undefined;
  const idGuardado = (exito?.valor as { id?: unknown } | null | undefined)?.id;
  const textoAvance = t.avanceResultado(
    formatearMontoTexto(c.total),
    nombreDe(c.tarjetaId),
    nombreDe(c.cuentaId),
  );
  useEffect(() => {
    if (!avanceGuardado) return;
    recordarAvance({
      texto: textoAvance,
      ...(typeof idGuardado === 'string' ? { transaccionId: idGuardado } : {}),
    });
    if (ruta !== '/registrar') irA('/registrar');
  }, [avanceGuardado, textoAvance, idGuardado, ruta, irA]);
  const vista = (operacion.previsualizacion ?? {}) as {
    readonly avisos?: readonly { readonly codigo: string; readonly datos?: unknown }[];
    readonly rechazos?: readonly Parameters<typeof mensajeDeRechazo>[0][];
  };
  /** AV-24 → una línea por tarjeta, con los valores del servidor. */
  const lineasAv24 = (): readonly string[] => {
    const d = vista.avisos?.find((a) => a.codigo === 'AV-24')?.datos as DatosAv24 | undefined;
    if (d === undefined) return [];
    const m = (x: number) => formatearMonto(x as Parameters<typeof formatearMonto>[0]);
    return [
      t.av24Tarjeta(nombreDe(d.origenId), m(d.origenAntes), m(d.origenDespues)),
      t.av24Tarjeta(nombreDe(d.destinoId), m(d.destinoAntes), m(d.destinoDespues)),
    ];
  };
  const rechazo = vista.rechazos?.[0];

  const sin =
    tarjetas.length < (esDeuda ? 2 : 1)
      ? t.sin[tarjetas.length < 1 ? 'tarjetas' : 'pocas']
      : esAvance && efectivo.length < 1
        ? t.sin.efectivo
        : undefined;
  if (sin !== undefined)
    return (
      <Marco superpuesto={superpuesto} titulo={titulo}>
        <Vacio
          titulo={sin.titulo}
          texto={sin.texto}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={ENLACE}>
              {c0.crearCuenta}
            </EnlaceFinn>
          }
        />
      </Marco>
    );

  if (estado === 'listo' && exito !== undefined) {
    const monto = formatearMontoTexto(c.total);
    const texto = esAvance
      ? t.avanceGuardado(monto, nombreDe(c.tarjetaId), nombreDe(c.cuentaId))
      : esDeuda
        ? t.transferenciaDeudaGuardada(monto, nombreDe(c.tarjetaId), nombreDe(c.tarjetaDestinoId))
        : t.entradaGuardada(monto, nombreDe(c.tarjetaId));
    return (
      <Marco superpuesto={superpuesto} titulo={listo}>
        <div className="flex flex-col gap-4">
          <Resultado texto={texto} />
          {cambios.length === 0 ? null : (
            <AvisoEnLinea estado="informacion" titulo={t.av24Titulo}>
              <ul data-testid="av-24">
                {cambios.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </AvisoEnLinea>
          )}
          <Boton
            onClick={() => {
              window.location.assign(window.location.pathname);
            }}
          >
            {c0.registrarOtro}
          </Boton>
        </div>
      </Marco>
    );
  }

  return (
    <Marco superpuesto={superpuesto} titulo={titulo}>
      {estado === 'confirmando' && rechazo !== undefined ? (
        <div className="flex flex-col gap-4">
          <AvisoEnLinea estado="problema" aparecioDespues>
            {mensajeDeRechazo(rechazo) ?? rechazo.codigo}
          </AvisoEnLinea>
          <Boton variante="secundaria" onClick={operacion.volverAEditar}>
            {c0.volverAEditar}
          </Boton>
        </div>
      ) : estado === 'confirmando' ? (
        <ConfirmacionImpacto
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          impacto={[t.av24Titulo, ...lineasAv24()]}
          avisos={[]}
          textoConfirmar={c0.confirmar}
          textoVolver={c0.volverAEditar}
          enviando={false}
          alConfirmar={() => {
            setCambios(lineasAv24());
            void operacion.confirmar();
          }}
          alVolver={operacion.volverAEditar}
        />
      ) : (
        <form
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          {comercio === undefined ? null : <p data-comercio>{comercio}</p>}
          {selecciones.map((x) => (
            <Seleccion
              key={x.campo}
              etiqueta={x.etiqueta}
              opciones={opciones(x.lista)}
              valor={c[x.campo]}
              alCambiar={poner(x.campo)}
              {...conError(x.campo)}
            />
          ))}
          <EntradaFecha
            nombre="fecha"
            etiqueta={c0.fecha}
            valor={c.fecha as FechaLocal}
            alCambiar={poner('fecha')}
            maxima={hoy}
            hoy={hoy}
            error={error('fecha')}
            requerido
          />
          <EntradaMonto
            nombre="total"
            etiqueta={c0.total}
            valor={c.total}
            alCambiar={poner('total')}
            error={error('total')}
            requerido
          />
          {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
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
          {/* [CH-240 E4-3] Una nota fija dice el efecto del tipo, sin cifras ni impacto en vivo */}
          {tipo === 'entrada-tarjeta' ? <NotaFija clave="entrada-tarjeta" /> : null}
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={c0.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {guardar}
          </Boton>
        </form>
      )}
    </Marco>
  );
}
