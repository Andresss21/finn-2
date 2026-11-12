'use client';
// `/actividad/[transaccionId]/editar` (FT-25, OP-28; 05 §2.6): corregir el monto, la fecha, la cuenta, el comercio, las partes o la nota
// de una transacción. Reúsa los campos de la edición de un movimiento (FT-35). Solo se envía lo que cambió, cada campo con el valor que se
// vio (04 §4.6.2); con AV-01 o AV-16 el servidor pide confirmar antes. Es un flujo largo: siempre página completa (05 §1.4). No calcula
// montos (PF-3): la suma de las partes la valida el servidor.
import { lazy, Suspense, useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { VistaDeImpacto } from '../../componentes/formularios/lineas-impacto';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import type { CuentaDeEdicion } from './edicion';
import {
  CerrarFlujoAlMontar,
  PaginaFlujoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { formatearMonto } from '../../formato';
import { faltaRepartir } from '../../formularios/normalizar-monto';
import { useFormularioFinn } from '../../formularios/use-formulario-finn';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { estados } from '../../textos/estados';
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
  readonly cuentas: readonly CuentaDeEdicion[];
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

interface Previsualizacion extends VistaDeImpacto {
  readonly avisos?: readonly { readonly codigo: string }[];
}

const ID_FORMULARIO = 'formulario-actividad-editar';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
/** Los rechazos que se muestran junto al campo de las partes, no como aviso del formulario. */
const DE_LAS_PARTES = [
  'suma_lineas_distinta',
  'linea_sin_destino',
  'linea_menor_que_eventos',
  'linea_con_eventos_cambio_destino',
];

const ConfirmacionImpacto = lazy(() =>
  import('../../componentes/formularios/confirmacion-impacto-de-vista').then((m) => ({
    default: m.ConfirmacionImpactoDeVista,
  })),
);
// Los campos se cargan aparte: el HTML del servidor ya los trae y el presupuesto de bytes de la ruta no los cuenta (05 §13.1)
const Edicion = lazy(() => import('./edicion'));

const BLOQUE_52 = 'h-13 rounded-control bg-superficie-hundida motion-safe:animate-pulse';
const BLOQUE_48 = 'h-12 rounded-control bg-superficie-hundida motion-safe:animate-pulse';
const BLOQUE_96 = 'h-24 rounded-control bg-superficie-hundida motion-safe:animate-pulse';

/** Mientras llegan los campos: cada control conserva su lugar (P1-02), no una página en blanco (V-01). */
function EsqueletoDeCampos() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4.5" data-cargando-campos>
      <span className="sr-only">{estados.cargando}</span>
      <div aria-hidden="true" className={BLOQUE_52} />
      <div aria-hidden="true" className="grid grid-cols-2 gap-2.5">
        <div className={BLOQUE_48} />
        <div className={BLOQUE_48} />
      </div>
      <div aria-hidden="true" className={BLOQUE_48} />
      <div aria-hidden="true" className={BLOQUE_96} />
      <div aria-hidden="true" className={BLOQUE_48} />
    </div>
  );
}

/** AV-16 de E3-15 (E4-1): advertencia si cambia la fecha, el total o la cuenta; información si no (04 OP-28, CA-25.4). */
function textoAv16(
  entrada: Record<string, unknown> | undefined,
  cuenta: string,
  repartoDistinto: boolean,
): string {
  const cambios = entrada ?? {};
  const mueve = ['fecha', 'total', 'cuentaId'].filter((k) => k in cambios);
  if (mueve.length > 0)
    return t.conciliadaAdvertencia(
      cuenta,
      mueve.map((k) => t.queCambio[k as 'fecha' | 'total' | 'cuentaId']).join(', '),
    );
  return repartoDistinto ? t.conciliadaRepartoDistinto(cuenta) : t.conciliadaInformacion(cuenta);
}

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
  const [camposListos, setCamposListos] = useState(false);
  const [enviada, setEnviada] = useState<Record<string, unknown>>();
  // E3-16: un rechazo del servidor queda en su campo y «Guardar cambios» espera a que se corrija (se compara con lo escrito al fallar)
  const [rechazo, setRechazo] = useState<{ fallo: unknown; escrito: string }>();
  const escrito = JSON.stringify(c);
  const rechazable = fallo !== undefined && !conflicto && !REINTENTABLES.includes(fallo.categoria);
  if (rechazable && rechazo?.fallo !== fallo) setRechazo({ fallo, escrito });
  const sinCorregir = rechazable && rechazo?.escrito === escrito;

  const alEnviar = formulario.handleSubmit(() => {
    // `getValues` y no el resultado del contrato: este quita el `lineaId` de cada parte
    const entrada = entradaDeEdicion(transaccionId, inicial, formulario.getValues(), visto.current);
    if (entrada === undefined) cerrar();
    else {
      setEnviada(entrada);
      return enviar(entrada);
    }
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
            vista={vista}
            avisos={(vista.avisos ?? []).map((a) =>
              a.codigo === 'AV-16'
                ? textoAv16(
                    enviada,
                    cuentas.find((x) => x.id === inicial.cuentaId)?.nombre ?? '',
                    enviada !== undefined && 'lineas' in enviada,
                  )
                : (t.avisos[a.codigo] ?? a.codigo),
            )}
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

  const guardar = (
    <Boton
      tipo="submit"
      form={ID_FORMULARIO}
      enviando={estado === 'enviando'}
      textoEnviando={t.guardando}
      deshabilitado={!enLinea || !camposListos || sinCorregir}
      className="w-full"
      {...(operacion.motivoSinEnvio !== undefined
        ? { motivoDeshabilitado: operacion.motivoSinEnvio }
        : sinCorregir
          ? { motivoDeshabilitado: t.corregiParaGuardar }
          : !camposListos
            ? { motivoDeshabilitado: t.cargandoCampos }
            : {})}
    >
      {t.guardar}
    </Boton>
  );

  return (
    <PaginaFlujoDeRuta titulo={t.editarTitulo} rutaPadre={detalle} acciones={guardar}>
      <form
        id={ID_FORMULARIO}
        onSubmit={(e) => void alEnviar(e)}
        noValidate
        className="flex flex-col gap-4.5"
      >
        {soloEtiquetas ? (
          <AvisoEnLinea estado="cero" titulo={t.cuentaArchivada}>
            {motivoCuenta}
          </AvisoEnLinea>
        ) : null}
        <Suspense fallback={<EsqueletoDeCampos />}>
          <Edicion
            alMontar={() => {
              setCamposListos(true);
            }}
            formulario={formulario}
            partes={partes}
            cuentas={cuentas}
            categorias={categorias}
            deudores={deudores}
            deLasPartes={deLasPartes}
            ayuda={ayuda}
            sinCuenta={sinCuenta}
            soloEtiquetas={soloEtiquetas}
            {...(motivoCuenta === undefined ? {} : { motivoCuenta })}
          />
        </Suspense>
        {fallo !== undefined &&
        deLasPartes === undefined &&
        !Object.values(fallo.campos ?? {}).includes(fallo.mensaje) ? (
          <AvisoEnLinea
            estado="problema"
            {...(conflicto ? { titulo: t.cambioMientrasEditabas } : {})}
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
      </form>
    </PaginaFlujoDeRuta>
  );
}
