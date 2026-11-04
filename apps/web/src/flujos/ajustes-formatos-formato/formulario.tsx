'use client';
// `/ajustes/formatos/nuevo` y `/ajustes/formatos/[formatoId]` (FT-73, OPT-05; 05 §2.11, §4.11): crear, editar, activar o
// desactivar un formato Flujo largo con borrador. La política del patrón (compila, banderas, grupos, retroceso) la aplica el
// servidor: sus rechazos llegan en `campos` y se muestran en el campo que corrige la persona. No calcula montos (PF-3).
import type { ErrorFinn } from '@finn/aplicacion/errores';
import { useCallback, useState, type SyntheticEvent } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Campo, EntradaTexto } from '../../componentes/base/campo';
import { CerrarFlujoAlMontar, PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { useBorrador } from '../../formularios/use-borrador';
import { useOperacion, type AccionEscritura } from '../../formularios/use-operacion';
import { ajustesFormatos as t } from '../../textos/ajustes-formatos';
import { formularios } from '../../textos/formularios';

const CAJA_SELECT =
  'min-h-12 w-full rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto focus-visible:border-b-4 focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-invalid:border-2 aria-invalid:border-problema-borde';
const RUTA_PADRE = '/ajustes/formatos';
const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];
const FORMATOS_FECHA = ['AAAA/MM/DD', 'AAAAMMDD', 'AAAA-MM-DD', 'DD/MM/AAAA'] as const;

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
  /** `guardarFormato` (OPT-05): la pone el lector, así el formulario se prueba sin servidor. */
  readonly guardar: AccionEscritura;
  readonly instituciones: readonly { readonly id: string; readonly nombre: string }[];
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

export function FormularioFormato({ guardar, instituciones, formato }: PropsFormularioFormato) {
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

  if (estado === 'listo')
    return (
      <PaginaFlujoDeRuta titulo={t.listo} rutaPadre={RUTA_PADRE}>
        <CerrarFlujoAlMontar rutaPadre={RUTA_PADRE} />
      </PaginaFlujoDeRuta>
    );

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
  return (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={RUTA_PADRE}>
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
        <EntradaTexto
          etiqueta={t.campos.patron}
          descripcion={t.campos.patronAyuda}
          requerido
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          value={valores.patron}
          onChange={(e) => {
            poner('patron', e.target.value);
          }}
          {...conError('patron')}
        />
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
        <Seleccionar
          etiqueta={t.campos.miles}
          valor={valores.montoSeparadorMiles}
          opciones={Object.entries(t.separadoresMiles)}
          alCambiar={(v) => {
            poner('montoSeparadorMiles', v);
          }}
          error={err('montoSeparadorMiles')}
        />
        <Seleccionar
          etiqueta={t.campos.decimal}
          valor={valores.montoSeparadorDecimal}
          opciones={Object.entries(t.separadoresDecimal)}
          alCambiar={(v) => {
            poner('montoSeparadorDecimal', v);
          }}
          error={err('montoSeparadorDecimal')}
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">{t.campos.fechas}</legend>
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
        <label className="flex min-h-11 items-center gap-3 font-medium">
          <input
            type="checkbox"
            className="size-11 shrink-0"
            checked={valores.activo}
            onChange={(e) => {
              poner('activo', e.target.checked);
            }}
          />
          {t.campos.activo}
        </label>
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
    </PaginaFlujoDeRuta>
  );
}
