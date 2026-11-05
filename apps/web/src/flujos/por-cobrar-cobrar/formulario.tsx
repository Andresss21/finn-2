'use client';
// `/por-cobrar/cobrar` (FT-46, OP-31; 05 §2): registrar lo que te devuelven por un gasto compartido, en efectivo o en una tarjeta.
// Es un flujo corto (05 §1.4). Se guarda en un solo viaje (05 §4.4) y sin «Antes de guardar» (P6-27 a): el servidor solo pide
// confirmar si la fecha es de un período cerrado (AV-01). Si la compra fue con tarjeta y el cobro entra en efectivo, la casilla de
// reservar viene marcada (AV-22, BE-36). No calcula montos (PF-3): la restitución, el excedente y el pago implícito son del servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { useMemo, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { ConfirmacionImpactoDeVista } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMontoTexto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { cobrarPorCobrar } from '../../servidor/acciones/eventos';
import { formularios } from '../../textos/formularios';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';
import { PieDeHoja } from '../pie-de-hoja';
import { CasillaReservar } from './casilla-reservar';
import { aEntradaDeAccion, contrato, type Campos } from './campos';

export interface PartidaDeCobro {
  readonly id: string;
  readonly deudor: string;
  readonly comercio: string;
  /** El saldo abierto, ya formateado, y en texto decimal para proponer el monto. */
  readonly abierto: string;
  readonly abiertoTexto: string;
  /** La tarjeta con que se pagó la compra, si hay propuesta AV-22 (y su categoría de pago existe). */
  readonly tarjeta: { readonly id: string; readonly nombre: string } | undefined;
  readonly categoriaPagoId: string | undefined;
}

export interface CuentaDeCobro {
  readonly id: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly tarjeta: boolean;
  readonly categoriaPagoId: string | undefined;
}

export interface PropsFormularioPorCobrarCobrar {
  readonly hoy: FechaLocal;
  readonly fecha: string;
  readonly rutaPadre: string;
  readonly lineaInicial: string;
  readonly partidas: readonly PartidaDeCobro[];
  readonly cuentas: readonly CuentaDeCobro[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Un rechazo que ya se muestra en su campo no se repite como aviso. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);
const ENLACE =
  'inline-flex min-h-11 items-center font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function FormularioPorCobrarCobrar(props: PropsFormularioPorCobrarCobrar) {
  const { hoy, rutaPadre, partidas, cuentas } = props;
  const [inicial] = useState<Campos>(() => ({
    lineaId: props.lineaInicial,
    cuentaId: cuentas.find((x) => !x.tarjeta)?.id ?? '',
    fecha: props.fecha,
    total: partidas.find((p) => p.id === props.lineaInicial)?.abiertoTexto ?? '',
    reservar: true,
  }));
  const partidaDe = (id: string) => partidas.find((p) => p.id === id);
  const cuentaDe = (id: string) => cuentas.find((x) => x.id === id);
  // La casilla existe si la compra fue con tarjeta (AV-22) y el cobro entra en efectivo (01 §4.10, O1).
  const conCasilla = (c: Campos): boolean =>
    partidaDe(c.lineaId)?.tarjeta !== undefined && cuentaDe(c.cuentaId)?.tarjeta === false;
  const enviar: AccionEscritura = (payload) =>
    cobrarPorCobrar(aEntradaDeAccion(payload, conCasilla));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const cancelar = rutaPadre;
  const partida = partidaDe(c.lineaId);
  const cuenta = cuentaDe(c.cuentaId);
  const poner = (n: 'lineaId' | 'cuentaId' | 'fecha' | 'total') => (valor: string) => {
    setValue(n, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const ponerReservar = (valor: boolean) => {
    setValue('reservar', valor, { shouldDirty: true });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as VistaDeImpacto & {
    readonly avisos?: readonly { readonly codigo: string }[];
  };
  const total = normalizarMontoEscrito(c.total);
  const totalFormateado = total.estado === 'valido' ? formatearMontoTexto(total.texto) : undefined;
  const opcionesCuenta = useMemo(
    () =>
      cuentas.map((x) => ({
        valor: x.id,
        etiqueta: x.nombre,
        detalle: x.detalle,
        icono: x.tarjeta ? ('card' as const) : ('bank' as const),
      })),
    [cuentas],
  );

  if (partida === undefined) return null;

  if (estado === 'listo' && exito !== undefined) {
    const aviso22 = exito.avisos.some((a) => a.codigo === 'AV-22');
    const pago = cuenta?.tarjeta
      ? { nombre: cuenta.nombre, id: cuenta.categoriaPagoId }
      : { nombre: partida.tarjeta?.nombre, id: partida.categoriaPagoId };
    return (
      <PaginaFlujoDeRuta titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <div className="flex flex-col gap-4">
          <Resultado texto={t.guardado(totalFormateado ?? c.total, partida.deudor)} />
          {aviso22 && pago.nombre !== undefined ? (
            <AvisoEnLinea
              estado="informacion"
              aparecioDespues
              {...(pago.id === undefined
                ? {}
                : {
                    accion: (
                      <EnlaceFinn href={`/presupuesto/asignar/${pago.id}`} className={ENLACE}>
                        {t.asignarA(pago.nombre)}
                      </EnlaceFinn>
                    ),
                  })}
            >
              {t.avisoAV22(pago.nombre)}
            </AvisoEnLinea>
          ) : null}
          {pago.id === undefined || pago.nombre === undefined ? null : (
            <EnlaceFinn href={`/presupuesto/categorias/${pago.id}`} className={ENLACE}>
              {t.verCategoria(pago.nombre)}
            </EnlaceFinn>
          )}
          <EnlaceFinn href={rutaPadre} className={ENLACE}>
            {t.volver}
          </EnlaceFinn>
        </div>
      </PaginaFlujoDeRuta>
    );
  }

  return (
    <PaginaFlujoDeRuta titulo={t.titulo(partida.deudor)} rutaPadre={rutaPadre}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpactoDeVista
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={
            (vista.avisos ?? []).some((a) => a.codigo === 'AV-01') ? [t.avisoPeriodoCerrado] : []
          }
          textoConfirmar={t.confirmar}
          textoVolver={t.volverAEditar}
          enviando={false}
          alConfirmar={() => void operacion.confirmar()}
          alVolver={operacion.volverAEditar}
        />
      ) : (
        <form
          onSubmit={(e) => void formulario.enviar(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {t.subtitulo(partida.comercio, partida.abierto)}
          </p>
          {partidas.length > 1 ? (
            <SeleccionNativa
              etiqueta={t.partida}
              alta
              marcador={t.marcadorPartida}
              opciones={partidas.map((p) => ({
                valor: p.id,
                etiqueta: `${p.deudor} · ${p.comercio}`,
                detalle: p.abierto,
              }))}
              valor={c.lineaId}
              alCambiar={(id) => {
                poner('lineaId')(id);
                poner('total')(partidaDe(id)?.abiertoTexto ?? '');
              }}
              error={error('lineaId')}
            />
          ) : null}
          <SeleccionNativa
            etiqueta={t.cuenta}
            alta
            marcador={t.marcadorCuenta}
            opciones={opcionesCuenta}
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
              maxima={hoy}
              hoy={hoy}
              error={error('fecha')}
              requerido
              sinVistaPrevia
            />
            <EntradaMonto
              nombre="total"
              etiqueta={t.monto}
              valor={c.total}
              alCambiar={poner('total')}
              error={error('total')}
              requerido
              prefijo="$"
              sinVistaPrevia
            />
          </div>
          {conCasilla(c) && partida.tarjeta !== undefined ? (
            <CasillaReservar
              marcada={c.reservar}
              alCambiar={ponerReservar}
              tarjeta={partida.tarjeta.nombre}
              monto={totalFormateado === partida.abierto ? partida.abierto : undefined}
            />
          ) : null}
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
          <PieDeHoja rutaPadre={cancelar} superpuesto={false}>
            <Boton
              tipo="submit"
              enviando={estado === 'enviando'}
              textoEnviando={t.cobrando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
            >
              {totalFormateado === undefined ? t.cobrar : t.cobrarMonto(totalFormateado)}
            </Boton>
          </PieDeHoja>
        </form>
      )}
    </PaginaFlujoDeRuta>
  );
}
