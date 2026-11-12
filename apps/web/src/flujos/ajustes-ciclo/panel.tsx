'use client';
// `/ajustes/ciclo` (FT-72, OP-19; 05 §2.11, §4.4; 06 FT-72; E6-13): flujo corto que empieza por el impacto. Al abrir y cada vez que se
// elige un día se pide la previsualización al servidor y se muestra AV-12 (desde cuándo rige y el período de transición) en la
// tarjeta «Antes de confirmar»; «Cambiar al día N» confirma siempre. Con el mismo día, `ciclo_sin_cambio` va en el campo y el botón
// queda deshabilitado, enlazado a ese mensaje. Los días del período de transición son un conteo de fechas del aviso, no un monto
// (PF-3). No importa nada de Next: lo prueba un componente.
import { useEffect, useId, useRef, useState } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, MensajeError } from '../../componentes/base/campo';
import { Resultado } from '../../componentes/base/resultado';
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
  /** `cerrarFlujo()` (05 §1.4): «Cancelar» y «Listo». */
  readonly alCerrar: () => void;
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

/** El párrafo de AV-12 con las fechas del servidor y, si hay período de transición, sus días. */
function textoAv12(datos: Datos): string {
  const inicio = datos['transicionInicio'];
  const fin = datos['transicionFin'];
  if (typeof inicio !== 'string' || typeof fin !== 'string') return t.sinTransicion;
  return t.transicion(corto(inicio), corto(fin), diasDelTramo(inicio, fin));
}

export function PanelCiclo({ accion, diaVigente, futura, alCerrar }: PropsPanelCiclo) {
  const operacion = useOperacion({ accion, previsualizarPrimero: true });
  const [dia, setDia] = useState(String(diaVigente));
  // El día para el que ya se pidió la previsualización: cada día nuevo la pide otra vez, también si el anterior seguía en vuelo.
  const [pedidoPara, setPedidoPara] = useState<string>();
  const [aplicado, setAplicado] = useState<{ dia: number; desde: string }>();
  const { estado, error: fallo, enviar } = operacion;
  const idError = useId();
  const vista = operacion.previsualizacion as Vista | undefined;
  const rechazo = vista?.rechazos?.[0];
  const av12 = vista?.avisos?.find((a) => a.codigo === 'AV-12');
  const datos = av12?.datos ?? {};

  useEffect(() => {
    if (estado === 'enviando' || estado === 'listo' || pedidoPara === dia) return;
    setPedidoPara(dia);
    void enviar({ diaInicio: Number(dia) });
  }, [dia, estado, pedidoPara, enviar]);

  // Si el cambio de día llegó mientras otra previsualización seguía en vuelo, `enviar` ignora el pedido: cuando ese termina y lo
  // que se ve no es del día elegido, se vuelve a pedir (hasta 3 veces, sin ciclos).
  const reintentos = useRef(0);
  useEffect(() => {
    if (estado === 'enviando' || estado === 'listo' || pedidoPara !== dia || vista === undefined)
      return;
    const deLaVista = rechazo?.datos?.['dia'] ?? datos['diaInicio'];
    if (deLaVista === undefined || Number(deLaVista) === Number(dia) || reintentos.current >= 3)
      return;
    reintentos.current += 1;
    void enviar({ diaInicio: Number(dia) });
  }, [estado, pedidoPara, dia, vista, rechazo, datos, enviar]);

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
        <Boton onClick={alCerrar}>{t.hecho}</Boton>
      </div>
    );

  const sinCambio = rechazo?.codigo === 'ciclo_sin_cambio';
  const mensajeRechazo =
    rechazo === undefined
      ? undefined
      : sinCambio
        ? t.rechazos.ciclo_sin_cambio(String(rechazo.datos?.['dia'] ?? dia))
        : t.rechazos.otro;
  // La previsualización a la vista es la del día elegido (no la de uno anterior que todavía no se reemplazó).
  const alDia = pedidoPara === dia && estado !== 'enviando';
  const listoParaConfirmar =
    alDia &&
    estado === 'confirmando' &&
    av12 !== undefined &&
    rechazo === undefined &&
    Number(datos['diaInicio']) === Number(dia);
  const calculando =
    aplicado === undefined && (estado === 'enviando' || (estado !== 'error' && pedidoPara !== dia));

  return (
    <div className="flex flex-col gap-6">
      {resumen}
      <div className="flex flex-col gap-1">
        <Campo etiqueta={t.nuevoDia} requerido>
          {(control) => (
            <select
              {...control}
              aria-describedby={sinCambio && alDia ? idError : control['aria-describedby']}
              aria-invalid={sinCambio && alDia ? true : undefined}
              className={CAJA}
              value={dia}
              onChange={(e) => {
                setDia(e.target.value);
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
        {sinCambio && alDia && mensajeRechazo !== undefined ? (
          <div id={idError}>
            <MensajeError>{mensajeRechazo}</MensajeError>
          </div>
        ) : null}
      </div>
      {calculando ? (
        <p role="status" className="text-cuerpo-pequeno text-texto-secundario">
          {t.calculando}
        </p>
      ) : null}
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
      {mensajeRechazo !== undefined && !sinCambio && alDia ? (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {mensajeRechazo}
        </AvisoEnLinea>
      ) : null}
      {listoParaConfirmar ? (
        <section
          aria-labelledby="ciclo-impacto"
          data-impacto
          className="flex flex-col gap-3 rounded-contenedor bg-superficie p-4 shadow-elevacion-1"
        >
          <h2 id="ciclo-impacto" className="text-titulo-seccion">
            {t.revisar}
          </h2>
          <p className="text-cuerpo font-semibold text-texto">
            {t.rigeDesde(formatearFecha(String(datos['rigeDesde'])))}
          </p>
          <p className="text-cuerpo-pequeno text-texto">{textoAv12(datos)}</p>
          <dl className="divide-y divide-borde-sutil">
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-cuerpo-pequeno text-texto-secundario">{t.diaDeInicio}</dt>
              <dd className="font-medium tabular-nums">{`${String(diaVigente)} → ${String(datos['diaInicio'])}`}</dd>
            </div>
            {typeof datos['transicionInicio'] === 'string' &&
            typeof datos['transicionFin'] === 'string' ? (
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-cuerpo-pequeno text-texto-secundario">{t.periodoTransicion}</dt>
                <dd className="font-medium tabular-nums">
                  {`${corto(datos['transicionInicio'])} – ${corto(datos['transicionFin'])}`}
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.dineroNoCambia}</p>
        </section>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Boton variante="secundaria" onClick={alCerrar}>
          {formularios.cancelar}
        </Boton>
        {listoParaConfirmar ? (
          <Boton
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
            onClick={() => {
              setAplicado({ dia: Number(datos['diaInicio']), desde: String(datos['rigeDesde']) });
              void operacion.confirmar();
            }}
          >
            {t.confirmarDia(Number(datos['diaInicio']))}
          </Boton>
        ) : (
          <Boton deshabilitado aria-describedby={sinCambio && alDia ? idError : undefined}>
            {t.confirmar}
          </Boton>
        )}
      </div>
    </div>
  );
}
