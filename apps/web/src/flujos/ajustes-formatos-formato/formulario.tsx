'use client';
// `/ajustes/formatos/nuevo` y `/ajustes/formatos/[formatoId]` (FT-73, OPT-05 y OPT-06; 05 §2.11, §4.11): crear, editar, activar o
// desactivar un formato y probarlo. Flujo largo con borrador; desde 1280 px, en dos columnas con «Probar con un SMS» fija (E5-10, E5-11).
// La política del patrón la aplica el servidor: sus rechazos llegan en `campos` con el texto de 04 §7.10 y se muestran en el campo que
// corrige la persona. No se eliminan: «Activo» es un interruptor de toda la fila. Al guardar, la lista muestra el resultado (E5-13).
import type { ErrorFinn, ResultadoAccion } from '@finn/aplicacion/errores';
import type { SalidaProbar } from '@finn/aplicacion/operaciones/formatos';
import { useCallback, useId, useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, EntradaTexto, MensajeError } from '../../componentes/base/campo';
import { SelectorSegmentado } from '../../componentes/base/selector-segmentado';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useBorrador } from '../../formularios/use-borrador';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesFormatos as t } from '../../textos/ajustes-formatos';
import { formularios } from '../../textos/formularios';
import { CAJA_SELECT, ProbarFormato, type SmsDePrueba } from './probar';

const RUTA_PADRE = '/ajustes/formatos';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const FORMATOS_FECHA = ['AAAA/MM/DD', 'AAAAMMDD', 'AAAA-MM-DD', 'DD/MM/AAAA'] as const;
// E5-10: área de texto de 4 líneas que parte en cualquier carácter; la caja es la de `CAJA_SELECT` (L13: clases literales)
const CAJA_PATRON =
  'w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 py-2 font-mono text-base break-all text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-invalid:border-2 aria-invalid:border-problema-borde';
const segmentos = (o: Readonly<Record<string, string>>) =>
  Object.entries(o).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/** E5-10: el botón `role="switch"` es toda la fila (48 px), nombrado por su texto y descrito por su ayuda. */
function InterruptorActivo({
  activo,
  alCambiar,
}: {
  readonly activo: boolean;
  readonly alCambiar: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-labelledby={`${id}-n`}
      aria-describedby={`${id}-d`}
      onClick={() => {
        alCambiar(!activo);
      }}
      className="flex min-h-12 w-full items-center gap-4 rounded-control text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span id={`${id}-n`} className="font-medium">
          {t.campos.activo}
        </span>
        <span id={`${id}-d`} className="text-sm text-texto-secundario">
          {t.campos.activoAyuda}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={
          activo
            ? 'flex h-7 w-12 shrink-0 items-center justify-end rounded-pastilla bg-accion p-0.5'
            : 'flex h-7 w-12 shrink-0 items-center justify-start rounded-pastilla bg-borde-control p-0.5'
        }
      >
        <span className="size-6 rounded-pastilla bg-superficie shadow-elevacion-1" />
      </span>
    </button>
  );
}

export interface FormatoGuardado {
  readonly id: string;
  readonly institucion: { readonly id: string; readonly nombre: string };
  readonly nombre: string;
  readonly tipoMovimiento: string;
  readonly patron: string;
  readonly banderas: string;
  readonly montoSeparadorMiles: string;
  readonly montoSeparadorDecimal: string;
  readonly formatosFecha: readonly string[];
  readonly activo: boolean;
}

export interface PropsFormularioFormato {
  /** `guardarFormato` (OPT-05) y `probarFormatoContraSms` (OPT-06): las pone el lector, así el formulario se prueba sin servidor. */
  readonly guardar: AccionEscritura;
  readonly probar: (entrada: unknown) => Promise<ResultadoAccion<SalidaProbar>>;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
  readonly smsParaProbar: readonly SmsDePrueba[];
  /** Con él se edita; sin él se crea (el `id` lo genera `useOperacion`). */
  readonly formato?: FormatoGuardado;
}

interface Campos {
  institucionId: string;
  nombre: string;
  tipoMovimiento: string;
  patron: string;
  banderas: string;
  montoSeparadorMiles: string;
  montoSeparadorDecimal: string;
  formatosFecha: string[];
  activo: boolean;
}

const inicial = (f: FormatoGuardado | undefined): Campos => ({
  institucionId: f?.institucion.id ?? '',
  nombre: f?.nombre ?? '',
  tipoMovimiento: f?.tipoMovimiento ?? 'compra',
  patron: f?.patron ?? '',
  banderas: f?.banderas ?? 'i',
  montoSeparadorMiles: f?.montoSeparadorMiles ?? ',',
  montoSeparadorDecimal: f?.montoSeparadorDecimal ?? '.',
  formatosFecha: [...(f?.formatosFecha ?? [])],
  activo: f?.activo ?? true,
});

/** Un rechazo cuyo mensaje ya se muestra en su campo no se repite como aviso del formulario. */
const enSuCampo = (e: ErrorFinn): boolean => Object.values(e.campos ?? {}).includes(e.mensaje);

function Seleccionar({
  etiqueta,
  valor,
  opciones,
  alCambiar,
  error,
}: {
  readonly etiqueta: string;
  readonly valor: string;
  readonly opciones: readonly (readonly [string, string])[];
  readonly alCambiar: (v: string) => void;
  readonly error: string | undefined;
}) {
  return (
    <Campo etiqueta={etiqueta} requerido {...(error === undefined ? {} : { error })}>
      {(control) => (
        <select
          {...control}
          className={CAJA_SELECT}
          value={valor}
          onChange={(e) => {
            alCambiar(e.target.value);
          }}
        >
          {opciones.map(([v, e]) => (
            <option key={v} value={v}>
              {e}
            </option>
          ))}
        </select>
      )}
    </Campo>
  );
}

export function FormularioFormato({
  guardar,
  probar,
  instituciones,
  smsParaProbar,
  formato,
}: PropsFormularioFormato) {
  const operacion = useOperacion({ accion: guardar, creacion: formato === undefined });
  const [valores, setValores] = useState<Campos>(() => inicial(formato));
  const borrador = useBorrador<Campos>({
    campos: valores,
    operacion,
    ...(formato === undefined ? {} : { entidad: formato.id }),
    restaurar: setValores,
    alDescartar: useCallback(() => {
      setValores(inicial(formato));
    }, [formato]),
  });
  const { estado, error: fallo } = operacion;
  const poner = <K extends keyof Campos>(n: K, v: Campos[K]) => {
    setValores((c) => ({ ...c, [n]: v }));
  };
  const campos = fallo?.campos ?? {};
  const err = (n: string): string | undefined => campos[n];
  const conError = (n: string): { error?: string } => {
    const m = err(n);
    return m === undefined ? {} : { error: m };
  };
  const tipos = Object.entries(t.tipos);
  const alta = formato === undefined;
  const titulo = alta ? t.tituloNuevo : t.tituloEditar;

  if (estado === 'listo') {
    // E5-13: la lista muestra el resultado del formato guardado (`?guardado=`)
    const guardado = (operacion.exito?.valor as { formatoId?: string } | undefined)?.formatoId;
    const destino = guardado === undefined ? RUTA_PADRE : `${RUTA_PADRE}?guardado=${guardado}`;
    return (
      <PaginaFlujoDeRuta titulo={t.listo} rutaPadre={destino}>
        <CerrarFlujoAlMontar rutaPadre={destino} />
      </PaginaFlujoDeRuta>
    );
  }

  const enviar = (e: SyntheticEvent) => {
    e.preventDefault();
    void operacion.enviar({ ...valores, ...(alta ? {} : { id: formato.id }) });
  };
  const alternarFecha = (f: string) => {
    poner(
      'formatosFecha',
      valores.formatosFecha.includes(f)
        ? valores.formatosFecha.filter((x) => x !== f)
        : [...valores.formatosFecha, f],
    );
  };
  // OPT-06 prueba el formato en edición: sin `activo`, y con la primera institución si todavía no se eligió
  const paraProbar = {
    institucionId: valores.institucionId || (instituciones[0]?.id ?? ''),
    nombre: valores.nombre,
    tipoMovimiento: valores.tipoMovimiento,
    patron: valores.patron,
    banderas: valores.banderas,
    montoSeparadorMiles: valores.montoSeparadorMiles,
    montoSeparadorDecimal: valores.montoSeparadorDecimal,
    formatosFecha: valores.formatosFecha,
  };
  return (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE} ancha>
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-2 xl:items-start">
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          {borrador.recuperado ? (
            <AvisoEnLinea
              estado="informacion"
              aparecioDespues
              accion={
                <Boton variante="secundaria" onClick={borrador.descartar}>
                  {formularios.descartarBorrador}
                </Boton>
              }
            >
              {formularios.borradorRecuperado}
            </AvisoEnLinea>
          ) : null}
          <Seleccionar
            etiqueta={t.campos.institucion}
            valor={valores.institucionId}
            opciones={[
              ['', t.campos.elegirInstitucion],
              ...instituciones.map((i) => [i.id, i.nombre] as const),
            ]}
            alCambiar={(v) => {
              poner('institucionId', v);
            }}
            error={err('institucionId')}
          />
          <EntradaTexto
            etiqueta={t.campos.nombre}
            requerido
            autoComplete="off"
            value={valores.nombre}
            onChange={(e) => {
              poner('nombre', e.target.value);
            }}
            {...conError('nombre')}
          />
          <Seleccionar
            etiqueta={t.campos.tipo}
            valor={valores.tipoMovimiento}
            opciones={tipos}
            alCambiar={(v) => {
              poner('tipoMovimiento', v);
            }}
            error={err('tipoMovimiento')}
          />
          <Campo
            etiqueta={t.campos.patron}
            descripcion={t.campos.patronAyuda}
            requerido
            {...conError('patron')}
          >
            {(control) => (
              <textarea
                {...control}
                rows={4}
                autoComplete="off"
                spellCheck={false}
                className={CAJA_PATRON}
                value={valores.patron}
                onChange={(e) => {
                  poner('patron', e.target.value);
                }}
              />
            )}
          </Campo>
          <EntradaTexto
            etiqueta={t.campos.banderas}
            descripcion={t.campos.banderasAyuda}
            autoComplete="off"
            spellCheck={false}
            value={valores.banderas}
            onChange={(e) => {
              poner('banderas', e.target.value);
            }}
            {...conError('banderas')}
          />
          {(['montoSeparadorMiles', 'montoSeparadorDecimal'] as const).map((n) => {
            const miles = n === 'montoSeparadorMiles';
            const m = err(n);
            return (
              <div key={n} className="flex flex-col items-start gap-1">
                <span aria-hidden="true" className="text-sm font-medium">
                  {miles ? t.campos.miles : t.campos.decimal}
                </span>
                <SelectorSegmentado
                  etiqueta={miles ? t.campos.miles : t.campos.decimal}
                  opciones={segmentos(miles ? t.separadoresMiles : t.separadoresDecimal)}
                  valor={valores[n]}
                  alCambiar={(v) => {
                    poner(n, v);
                  }}
                />
                {m === undefined ? null : <MensajeError>{m}</MensajeError>}
              </div>
            );
          })}
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">{t.campos.fechas}</legend>
            <p className="text-sm text-texto-secundario">{t.campos.fechasAyuda}</p>
            {FORMATOS_FECHA.map((f) => (
              <label key={f} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-11 shrink-0"
                  checked={valores.formatosFecha.includes(f)}
                  onChange={() => {
                    alternarFecha(f);
                  }}
                />
                {f}
              </label>
            ))}
            {err('formatosFecha') === undefined ? null : (
              <p className="text-sm text-problema-texto">{err('formatosFecha')}</p>
            )}
          </fieldset>
          <InterruptorActivo
            activo={valores.activo}
            alCambiar={(v) => {
              poner('activo', v);
            }}
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
            textoEnviando={t.guardando}
            deshabilitado={!operacion.enLinea}
            {...(operacion.motivoSinEnvio === undefined
              ? {}
              : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          >
            {t.guardar}
          </Boton>
        </form>
        <ProbarFormato probar={probar} sms={smsParaProbar} formato={paraProbar} />
      </div>
    </PaginaFlujoDeRuta>
  );
}
