'use client';
// `/actividad/[transaccionId]/editar` (FT-25, OP-28; 05 §2.6): corregir el monto, la fecha, la cuenta, el comercio, las partes o la nota
// de una transacción. Reúsa los campos de la edición de un movimiento (FT-35). Solo se envía lo que cambió, cada campo con el valor que se
// vio (04 §4.6.2); con AV-01 o AV-16 el servidor pide confirmar antes. Es un flujo largo: siempre página completa (05 §1.4). No calcula
// montos (PF-3): la suma de las partes la valida el servidor.
import { lazy, Suspense, useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { faltaRepartir } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { formularios } from '../../textos/formularios';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import { contrato, entradaDeEdicion, vistoDeConflicto, type Campos } from './campos';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}
export interface PropsFormularioActividadEditar {
  readonly transaccionId: string;
  readonly inicial: Campos;
  readonly cuentas: readonly Referencia[];
  readonly categorias: readonly Referencia[];
  readonly deudores: readonly Referencia[];
  /** La transacción mueve más de una cuenta: no se ofrece cambiarla. */
  readonly sinCuenta: boolean;
  /** Cuenta archivada (CB-24): solo categoría, comercio y nota. */
  readonly soloEtiquetas: boolean;
  /** Por qué no se puede cambiar la cuenta (`restricciones.puedeCambiarCuenta`). */
  readonly motivoCuenta?: string;
  /** El detalle al que se vuelve al terminar (con su `?volver=`). */
  readonly detalle: string;
  /** La Server Action de OP-28: la pasa el lector. */
  readonly accion: AccionEscritura;
}

interface Previsualizacion {
  readonly impacto?: { readonly deltaLpa: number } | null;
  readonly avisos?: readonly { readonly codigo: string }[];
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Los rechazos que se muestran junto al campo de las partes, no como aviso del formulario. */
const DE_LAS_PARTES = [
  'suma_lineas_distinta',
  'linea_sin_destino',
  'linea_menor_que_eventos',
  'linea_con_eventos_cambio_destino',
];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto').then((m) => ({
    default: m.ConfirmacionImpacto,
  })),
);
// Los campos se cargan aparte: el HTML del servidor ya los trae y el presupuesto de bytes de la ruta no los cuenta (05 §13.1)
const Edicion = lazy(() => import('../bandeja-movimiento/edicion'));

export function FormularioActividadEditar({
  transaccionId,
  inicial,
  cuentas,
  categorias,
  deudores,
  sinCuenta,
  soloEtiquetas,
  motivoCuenta,
  detalle,
  accion,
}: PropsFormularioActividadEditar) {
  const operacion = useOperacion({ accion });
  const cerrar = useCerrarFlujo(detalle, false);
  const visto = useRef<Record<string, unknown>>({}); // lo que la persona vio y ya cambió (conflicto), sobre `base`
  const formulario = useFormularioFinn<Campos>({
    contrato,
    valoresIniciales: inicial,
    operacion,
  });
  const partes = useFieldArray({ control: formulario.control, name: 'lineas' });
  const c = formulario.watch();
  const { estado, error: fallo, enLinea } = operacion;
  const vista = (operacion.previsualizacion ?? {}) as Previsualizacion;
  const deLasPartes =
    fallo !== undefined && DE_LAS_PARTES.includes(fallo.codigo) ? fallo.mensaje : undefined;
  const conflicto = fallo?.codigo === 'conflicto_desactualizado';
  const { enviar } = operacion;

  const alEnviar = formulario.handleSubmit(() => {
    // `getValues` y no el resultado del contrato: este quita el `lineaId` de cada parte
    const entrada = entradaDeEdicion(transaccionId, inicial, formulario.getValues(), visto.current);
    if (entrada === undefined) cerrar();
    else return enviar(entrada);
    return undefined;
  });

  if (estado === 'listo') return <CerrarFlujoAlMontar rutaPadre={detalle} />;

  if (estado === 'confirmando')
    return (
      <PaginaFlujoDeRuta titulo={t.editarTitulo} rutaPadre={detalle}>
        <Suspense fallback={null}>
          <ConfirmacionImpacto
            titulo={t.revisar}
            {...(operacion.impactoCambio ? { nota: formularios.impactoCambio } : {})}
            impacto={
              vista.impacto
                ? [
                    t.impactoLpa(
                      `${vista.impacto.deltaLpa > 0 ? '+' : ''}${formatearMonto(vista.impacto.deltaLpa as never)}`,
                    ),
                  ]
                : []
            }
            avisos={(vista.avisos ?? []).map((a) => t.avisos[a.codigo] ?? a.codigo)}
            textoConfirmar={t.confirmar}
            textoVolver={t.volverAEditar}
            enviando={false}
            alConfirmar={() => void operacion.confirmar()}
            alVolver={operacion.volverAEditar}
          />
        </Suspense>
      </PaginaFlujoDeRuta>
    );

  const falta = faltaRepartir(
    c.total,
    c.lineas.map((l) => l.monto),
  );
  const ayuda =
    falta === undefined
      ? undefined
      : falta > 0
        ? g.faltaRepartir(formatearMonto(falta))
        : falta < 0
          ? g.sobraRepartir
          : g.todoRepartido;

  return (
    <PaginaFlujoDeRuta titulo={t.editarTitulo} rutaPadre={detalle}>
      <form onSubmit={(e) => void alEnviar(e)} noValidate className="flex flex-col gap-5">
        <Suspense fallback={null}>
          <Edicion
            formulario={formulario}
            partes={partes}
            cuentas={cuentas}
            categorias={categorias}
            deudores={deudores}
            deLasPartes={deLasPartes}
            ayuda={ayuda}
            registrada={{
              sinCuenta,
              soloEtiquetas,
              ...(motivoCuenta === undefined ? {} : { motivoCuenta }),
            }}
          />
        </Suspense>
        {fallo !== undefined &&
        deLasPartes === undefined &&
        !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(conflicto || REINTENTABLES.includes(fallo.categoria)
              ? {
                  accion: (
                    <Boton
                      variante="secundaria"
                      onClick={() => {
                        if (conflicto) {
                          visto.current = {
                            ...visto.current,
                            ...vistoDeConflicto(fallo.datos ?? {}),
                          };
                          operacion.volverAEditar();
                        } else void operacion.reintentar();
                      }}
                    >
                      {conflicto ? formularios.usarValorActual : formularios.intentarDeNuevo}
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
          deshabilitado={!enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
        >
          {t.guardar}
        </Boton>
      </form>
    </PaginaFlujoDeRuta>
  );
}
