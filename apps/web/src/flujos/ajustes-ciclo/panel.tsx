'use client';
// `/ajustes/ciclo` (FT-72, OP-19; 05 §2.11, §4.4; 06 FT-72): elegir el nuevo día de inicio, ver qué dice AV-12 (desde cuándo rige
// y el período de transición) y confirmar siempre. Previsualiza primero: nada se guarda hasta "Cambiar el ciclo". Los días del
// período de transición son un conteo de fechas del aviso, no un monto (PF-3). No importa nada de Next: lo prueba un componente.
import { useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo } from '../../componentes/base/campo';
import { Resultado } from '../../componentes/base/resultado';
import { ConfirmacionImpacto } from '../../componentes/formularios/confirmacion-impacto';
import { formatearFecha } from '../../formato';
import { diasDelTramo } from '../../formato/dias-del-tramo';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesCiclo as t } from '../../textos/ajustes-ciclo';
import { formularios } from '../../textos/formularios';

export interface PropsPanelCiclo {
  /** `cambiarCiclo` (OP-19): la pone el lector, así el panel se prueba sin servidor. */
  readonly accion: AccionEscritura;
  readonly diaVigente: number;
  readonly futura?: { readonly diaInicio: number; readonly rigeDesde: string };
}

type Datos = Readonly<Record<string, string | number | undefined>>;
interface Vista {
  readonly avisos?: readonly { readonly codigo: string; readonly datos?: Datos }[];
  readonly rechazos?: readonly { readonly codigo: string; readonly datos?: Datos }[];
}

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
// Mismo aspecto que el campo relleno de `Input`; la clase del estado inválido va en la misma cadena (L15).
const CAJA =
  'min-h-12 w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-invalid:border-2 aria-invalid:border-problema-borde';

const corto = (f: string): string => formatearFecha(f).slice(0, 5);

/** El texto de AV-12 con las fechas del servidor y, si hay período de transición, sus días. */
function textoAv12(datos: Datos): string {
  const desde = String(datos['rigeDesde']);
  const inicio = datos['transicionInicio'];
  const fin = datos['transicionFin'];
  const rige = t.rigeDesde(formatearFecha(desde));
  if (typeof inicio !== 'string' || typeof fin !== 'string') return `${rige} ${t.sinTransicion}`;
  return `${rige} ${t.transicion(corto(inicio), corto(fin), diasDelTramo(inicio, fin))}`;
}

export function PanelCiclo({ accion, diaVigente, futura }: PropsPanelCiclo) {
  const operacion = useOperacion({ accion, previsualizarPrimero: true });
  const [dia, setDia] = useState(String(diaVigente));
  const [aplicado, setAplicado] = useState<{ dia: number; desde: string }>();
  const { estado, error: fallo, impactoCambio } = operacion;
  const vista = operacion.previsualizacion as Vista | undefined;
  const rechazo = vista?.rechazos?.[0];
  const av12 = vista?.avisos?.find((a) => a.codigo === 'AV-12');

  const resumen = (
    <dl className="rounded-contenedor bg-superficie px-4 py-1 shadow-elevacion-1">
      <div className="flex items-baseline justify-between gap-4 border-b border-borde-sutil py-2">
        <dt className="text-cuerpo-pequeno text-texto-secundario">{t.vigente}</dt>
        <dd className="font-medium tabular-nums" data-ciclo-vigente>
          {diaVigente}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 py-2">
        <dt className="text-cuerpo-pequeno text-texto-secundario">{t.futura}</dt>
        <dd className="text-right font-medium" data-ciclo-futura>
          {futura === undefined
            ? t.sinFutura
            : t.futuraDetalle(futura.diaInicio, formatearFecha(futura.rigeDesde))}
        </dd>
      </div>
    </dl>
  );

  if (estado === 'listo' && aplicado !== undefined)
    return (
      <div className="flex flex-col gap-6">
        {resumen}
        <Resultado texto={t.listo(aplicado.dia, formatearFecha(aplicado.desde))} />
      </div>
    );

  if (
    av12 !== undefined &&
    rechazo === undefined &&
    (estado === 'confirmando' || estado === 'enviando')
  ) {
    const datos = av12.datos ?? {};
    return (
      <div className="flex flex-col gap-6">
        {resumen}
        <ConfirmacionImpacto
          titulo={t.revisar}
          {...(impactoCambio ? { nota: formularios.impactoCambio } : {})}
          impacto={[t.dineroNoCambia]}
          avisos={[textoAv12(datos)]}
          textoConfirmar={t.confirmar}
          textoVolver={t.volverAEditar}
          enviando={estado === 'enviando'}
          alConfirmar={() => {
            setAplicado({ dia: Number(datos['diaInicio']), desde: String(datos['rigeDesde']) });
            void operacion.confirmar();
          }}
          alVolver={operacion.volverAEditar}
        />
      </div>
    );
  }

  const error =
    rechazo === undefined
      ? undefined
      : rechazo.codigo === 'ciclo_sin_cambio'
        ? t.rechazos.ciclo_sin_cambio(String(rechazo.datos?.['dia'] ?? dia))
        : t.rechazos.otro;
  const enviar = (e: SyntheticEvent) => {
    e.preventDefault();
    void operacion.enviar({ diaInicio: Number(dia) });
  };
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {resumen}
      <Campo etiqueta={t.nuevoDia} requerido {...(error === undefined ? {} : { error })}>
        {(control) => (
          <select
            {...control}
            className={CAJA}
            value={dia}
            onChange={(e) => {
              setDia(e.target.value);
              if (estado === 'confirmando') operacion.volverAEditar();
            }}
          >
            {DIAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </Campo>
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
        {t.verCambio}
      </Boton>
    </form>
  );
}
