'use client';
// `/cuentas/[cuentaId]/pagar` (FT-30, OP-23; 05 §2.7): pagar una tarjeta desde una cuenta de efectivo con el desglose del ciclo a la
// vista. Es un flujo corto (05 §1.4). Se guarda en un solo viaje (05 §4.4); si el pago supera lo reservado (AV-10) o la fecha es de
// un período cerrado (AV-01) el servidor pide confirmar y la previsualización trae el saldo a favor que quedaría. No calcula
// montos (PF-3): el desglose, los atajos y el saldo a favor son del servidor.
import type { ErrorFinn } from '@finn/aplicacion/errores';
import type { FechaLocal } from '@finn/dominio/valores';
import { useMemo, useState } from 'react';
import { ErrorDeFlujo } from '../../componentes/formularios/error-de-flujo';
import { Boton } from '../../componentes/base/boton';
import { Pastillas } from '../../componentes/base/pastillas';
import { SeleccionNativa } from '../../componentes/base/seleccion-nativa';
import { ConfirmacionImpactoDeVista } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import { CerrarFlujoAlMontar, useCerrarFlujo } from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto, formatearMontoTexto } from '../../formato';
import { normalizarMontoEscrito } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { pagarTarjeta } from '../../servidor/acciones/transacciones';
import { cuentasPagar as t } from '../../textos/cuentas-pagar';
import { formularios } from '../../textos/formularios';
import { MarcoCorto } from '../cuentas-archivar/marco-corto';
import { rutaConResultado } from '../cuentas-archivar/resultado';
import { aEntradaDeAccion, contrato, type Campos, type Previsualizacion } from './campos';

export interface PropsFormularioCuentasPagar {
  readonly tarjetaId: string;
  readonly tarjetaNombre: string;
  readonly hoy: FechaLocal;
  /** La deuda de la tarjeta, ya formateada. */
  readonly deuda: string;
  readonly origenes: readonly {
    readonly id: string;
    readonly nombre: string;
    readonly detalle: string;
  }[];
  readonly origenPropuesto: string | undefined;
  /** El desglose al pagar (04 §6.14.4), cada monto ya formateado por el lector. */
  readonly filas: readonly {
    readonly clave: string;
    readonly etiqueta: string;
    readonly monto: string;
  }[];
  /** Los montos rápidos (para no generar intereses, toda la deuda, lo reservado), en texto decimal. */
  readonly atajos: readonly { readonly etiqueta: string; readonly valor: string }[];
  readonly montoInicial: string;
  readonly categoriaPagoId: string | undefined;
  /** GLO-23: abierto como hoja o panel sobre el detalle (ruta interceptada). */
  readonly superpuesto?: boolean;
}

/** Un rechazo que ya se muestra en su campo no se repite como aviso. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

export function FormularioCuentasPagar(props: PropsFormularioCuentasPagar) {
  const { tarjetaId, tarjetaNombre: nombre, hoy, origenes, superpuesto = false } = props;
  const rutaPadre = `/cuentas/${tarjetaId}`;
  const enviar: AccionEscritura = (payload) => pagarTarjeta(aEntradaDeAccion(tarjetaId, payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const [inicial] = useState<Campos>(() => ({
    origenId: props.origenPropuesto ?? '',
    fecha: hoy,
    total: props.montoInicial,
  }));
  const formulario = useFormularioFinn<Campos>({ contrato, valoresIniciales: inicial, operacion });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const cancelar = useCerrarFlujo(rutaPadre, superpuesto);
  const opciones = useMemo(
    () =>
      origenes.map((o) => ({
        valor: o.id,
        etiqueta: o.nombre,
        detalle: o.detalle,
        icono: 'wallet' as const,
      })),
    [origenes],
  );
  const poner = (n: keyof Campos) => (valor: string) => {
    setValue(n, valor, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof Campos): string | undefined => formState.errors[n]?.message;
  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;
  const total = normalizarMontoEscrito(c.total);

  // E2-13: el pago no tiene pantalla de resultado propia: vuelve al detalle de la tarjeta y el resultado queda bajo sus acciones.
  if (estado === 'listo' && exito !== undefined) {
    return (
      <MarcoCorto superpuesto={superpuesto} titulo={t.tituloListo} rutaPadre={rutaPadre}>
        <CerrarFlujoAlMontar
          rutaPadre={rutaConResultado(rutaPadre, {
            tipo: 'pagado',
            monto: total.estado === 'valido' ? total.texto : '0',
            excedente: exito.avisos.some((a) => a.codigo === 'AV-04'),
          })}
        />
      </MarcoCorto>
    );
  }

  const avisosDeLaVista = (vista.avisos ?? []).flatMap((a) => {
    if (a.codigo === 'AV-10')
      return [t.avisos['AV-10'](formatearMonto((a.datos?.['exceso'] ?? 0) as never), nombre)];
    if (a.codigo === 'AV-01') return [t.avisos['AV-01']];
    return [];
  });
  const aFavor = vista.propuesta?.saldoAFavor ?? 0;

  return (
    <MarcoCorto superpuesto={superpuesto} titulo={t.titulo(nombre)} rutaPadre={rutaPadre}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpactoDeVista
          titulo={t.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={[
            ...avisosDeLaVista,
            ...(aFavor > 0 ? [t.saldoAFavor(formatearMonto(aFavor as never), nombre)] : []),
          ]}
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
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.deuda(props.deuda)}</p>
          <SeleccionNativa
            etiqueta={t.desde}
            alta
            marcador={t.marcador}
            opciones={opciones}
            valor={c.origenId}
            alCambiar={poner('origenId')}
            error={error('origenId')}
          />
          <dl
            aria-label={t.desglose}
            className="flex flex-col gap-2 rounded-contenedor bg-superficie p-3.5 shadow-elevacion-1"
          >
            {props.filas.map((f) => (
              <div key={f.clave} className="flex items-baseline justify-between gap-3">
                <dt className="text-cuerpo-pequeno text-texto-secundario">{f.etiqueta}</dt>
                <dd className="tabular-nums">{f.monto}</dd>
              </div>
            ))}
          </dl>
          {props.atajos.length === 0 ? null : (
            <Pastillas
              etiqueta={t.atajos}
              opciones={props.atajos.map((a) => ({ valor: a.valor, etiqueta: a.etiqueta }))}
              valor={c.total}
              alCambiar={poner('total')}
            />
          )}
          <div className="grid grid-cols-2 gap-2.5 [&>*]:min-w-0">
            <EntradaMonto
              nombre="total"
              etiqueta={t.monto}
              valor={c.total}
              alCambiar={poner('total')}
              error={error('total')}
              requerido
              prefijo="$"
              compacto
              sinVistaPrevia
            />
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
          </div>
          {estado === 'error' && fallo !== undefined && !enSuCampo(fallo) ? (
            <ErrorDeFlujo
              tipo="corto"
              error={fallo}
              alReintentar={() => void operacion.reintentar()}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            <Boton variante="secundaria" onClick={cancelar}>
              {t.cancelar}
            </Boton>
            <Boton
              tipo="submit"
              enviando={estado === 'enviando'}
              textoEnviando={t.pagando}
              deshabilitado={!operacion.enLinea}
              {...(operacion.motivoSinEnvio === undefined
                ? {}
                : { motivoDeshabilitado: operacion.motivoSinEnvio })}
            >
              {total.estado === 'valido' ? t.pagarMonto(formatearMontoTexto(total.texto)) : t.pagar}
            </Boton>
          </div>
        </form>
      )}
    </MarcoCorto>
  );
}
