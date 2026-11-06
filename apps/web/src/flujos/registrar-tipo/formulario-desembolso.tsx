'use client';
// `/registrar/desembolso` (FT-56, OP-26; 05 §2.4): el flujo corto del dinero de un préstamo nuevo que llega a una cuenta de efectivo.
// Se guarda en un solo viaje (05 §4.4); con la fecha en un período cerrado el servidor pide confirmar con AV-01 antes de escribir.
// No calcula montos (PF-3): el impacto lo trae el servidor.
import type { FechaLocal } from '@finn/dominio/valores';
import { useMemo } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { Seleccion } from '../../componentes/base/seleccion';
import { Vacio } from '../../componentes/base/vacio';
import { ConfirmacionImpactoDeVista as ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto-de-vista';
import { EntradaFecha } from '../../componentes/formularios/entrada-fecha';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearMontoTexto } from '../../formato';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { registrarDesembolso } from '../../servidor/acciones/transacciones';
import { formularios } from '../../textos/formularios';
import { registrarDesembolso as t } from '../../textos/registrar-desembolso';
import { registrarTipo as c0 } from '../../textos/registrar-tipo';
import {
  aEntradaDeDesembolso,
  contratoDesembolso,
  valoresInicialesDesembolso,
  type CamposDesembolso,
} from './campos-desembolso';
import { ENLACE, Marco, REINTENTABLES, enSuCampo } from './formulario';

type Cuenta = { readonly id: string; readonly nombre: string };

export interface PropsFormularioDesembolso {
  readonly hoy: FechaLocal;
  readonly prestamos: readonly Cuenta[];
  readonly efectivo: readonly Cuenta[];
  readonly prestamoPropuesto: string | undefined;
  readonly cuentaPropuesta: string | undefined;
  /** Interceptado sobre la pantalla de origen (05 §1.4): hoja o panel; sin él, página completa. */
  readonly superpuesto?: boolean;
}

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

export function FormularioDesembolso({
  hoy,
  prestamos,
  efectivo,
  prestamoPropuesto,
  cuentaPropuesta,
  superpuesto = false,
}: PropsFormularioDesembolso) {
  const enviar: AccionEscritura = (payload) => registrarDesembolso(aEntradaDeDesembolso(payload));
  const operacion = useOperacion({ accion: enviar, creacion: true });
  const inicial = useMemo(
    () => valoresInicialesDesembolso(hoy, prestamoPropuesto, cuentaPropuesta),
    [hoy, prestamoPropuesto, cuentaPropuesta],
  );
  const formulario = useFormularioFinn<CamposDesembolso>({
    contrato: contratoDesembolso,
    valoresIniciales: inicial,
    operacion,
  });
  const { setValue, formState } = formulario;
  const c = formulario.watch();
  const poner = (n: keyof CamposDesembolso) => (valor: string) => {
    setValue(n, valor as never, { shouldDirty: true, shouldValidate: formState.isSubmitted });
  };
  const error = (n: keyof CamposDesembolso): string | undefined => formState.errors[n]?.message;
  const conError = (n: keyof CamposDesembolso): { error?: string } => {
    const mensaje = error(n);
    return mensaje === undefined ? {} : { error: mensaje };
  };
  const opciones = (l: readonly Cuenta[]) => l.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
  const nombreDe = (id: string): string =>
    [...prestamos, ...efectivo].find((x) => x.id === id)?.nombre ?? '';

  const { estado, error: fallo, exito } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;

  const sin =
    prestamos.length < 1 ? t.sin.prestamos : efectivo.length < 1 ? t.sin.efectivo : undefined;
  if (sin !== undefined)
    return (
      <Marco superpuesto={superpuesto} titulo={t.titulo}>
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

  if (estado === 'listo' && exito !== undefined)
    return (
      <Marco superpuesto={superpuesto} titulo={t.listo}>
        <div className="flex flex-col gap-4">
          <Resultado
            texto={t.guardado(
              formatearMontoTexto(c.total),
              nombreDe(c.prestamoId),
              nombreDe(c.cuentaId),
            )}
          />
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

  return (
    <Marco superpuesto={superpuesto} titulo={t.titulo}>
      {estado === 'confirmando' ? (
        <ConfirmacionImpacto
          titulo={c0.revisar}
          {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
          vista={vista}
          avisos={(vista.avisos ?? []).map((a) =>
            a.codigo === 'AV-01' ? c0.avisoPeriodoCerrado : a.codigo,
          )}
          textoConfirmar={c0.confirmar}
          textoVolver={c0.volverAEditar}
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
          <Seleccion
            etiqueta={t.prestamo}
            opciones={opciones(prestamos)}
            valor={c.prestamoId}
            alCambiar={poner('prestamoId')}
            {...conError('prestamoId')}
          />
          <Seleccion
            etiqueta={t.cuenta}
            opciones={opciones(efectivo)}
            valor={c.cuentaId}
            alCambiar={poner('cuentaId')}
            {...conError('cuentaId')}
          />
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
          <Boton
            tipo="submit"
            enviando={estado === 'enviando'}
            textoEnviando={c0.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {t.guardar}
          </Boton>
        </form>
      )}
    </Marco>
  );
}
