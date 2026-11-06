'use client';
// Cuerpo de `/ajustes/diagnostico` (FT-76; 05 §2.11; el marco lo pone la página): los eventos que trajo `ajustes()` (los 50 últimos, ya ordenados por el servidor), un
// buscador por referencia o texto que filtra en el navegador, y el disparador manual de la tarea diaria (04 §10.1). No calcula nada (PF-3).
import { useState } from 'react';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Boton } from '../../../../componentes/base/boton';
import { EntradaTexto } from '../../../../componentes/base/campo';
import { formatearInstante } from '../../../../formato';
import { useOperacion, type AccionEscritura } from '../../../../formularios/use-operacion';
import { ajustesDiagnostico as t } from '../../../../textos/ajustes-diagnostico';
import { formularios } from '../../../../textos/formularios';

export interface EventoDiagnostico {
  readonly ocurridoEn: string;
  readonly nivel: 'aviso' | 'error';
  readonly origen: string;
  readonly mensaje: string;
  readonly idError?: string;
}

export interface PropsPanelDiagnostico {
  /** `AjustesDto.diagnostico`. */
  readonly eventos: readonly EventoDiagnostico[];
  /** La Server Action de «Ejecutar tareas ahora»: la pasa la página, para que este módulo se pruebe sin el servidor. */
  readonly ejecutar: AccionEscritura;
  /** El commit desplegado, para el procedimiento de 07 §31; vacío en local. */
  readonly version?: string;
}

const REINTENTABLES = ['OCUPADO', 'INCIERTO', 'INTERNO'];

function coincide(e: EventoDiagnostico, busqueda: string): boolean {
  const q = busqueda.trim().toLowerCase();
  if (q === '') return true;
  return [e.idError ?? '', e.origen, e.mensaje].some((x) => x.toLowerCase().includes(q));
}

export function PanelDiagnostico({ eventos, ejecutar, version }: PropsPanelDiagnostico) {
  const operacion = useOperacion({ accion: ejecutar });
  const [busqueda, setBusqueda] = useState('');
  const { estado, error } = operacion;
  const visibles = eventos.filter((e) => coincide(e, busqueda));
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="tareas" className="flex flex-col gap-3">
        <h2 id="tareas" className="text-titulo-seccion">
          {t.tareasTitulo}
        </h2>
        <p className="text-cuerpo-pequeno text-texto">{t.tareasDetalle}</p>
        {estado === 'error' && error !== undefined ? (
          <AvisoEnLinea
            estado="problema"
            aparecioDespues
            {...(REINTENTABLES.includes(error.categoria)
              ? {
                  accion: (
                    <Boton variante="secundaria" onClick={() => void operacion.reintentar()}>
                      {formularios.intentarDeNuevo}
                    </Boton>
                  ),
                }
              : {})}
          >
            {error.mensaje}
          </AvisoEnLinea>
        ) : null}
        {estado === 'listo' ? (
          <AvisoEnLinea estado="positivo" aparecioDespues>
            {t.ejecutadas}
          </AvisoEnLinea>
        ) : null}
        <Boton
          variante="secundaria"
          enviando={estado === 'enviando'}
          textoEnviando={t.ejecutando}
          deshabilitado={!operacion.enLinea}
          {...(operacion.motivoSinEnvio === undefined
            ? {}
            : { motivoDeshabilitado: operacion.motivoSinEnvio })}
          onClick={() => {
            void operacion.enviar({});
          }}
        >
          {t.ejecutar}
        </Boton>
      </section>
      {version === undefined || version === '' ? null : (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {t.version}:{' '}
          <code className="font-mono" translate="no" data-testid="version">
            {version.slice(0, 12)}
          </code>
        </p>
      )}
      <section aria-labelledby="eventos" className="flex flex-col gap-3">
        <h2 id="eventos" className="text-titulo-seccion">
          {t.eventos}
        </h2>
        <EntradaTexto
          etiqueta={t.buscar}
          descripcion={t.buscarAyuda}
          type="search"
          value={busqueda}
          autoComplete="off"
          spellCheck={false}
          onChange={(ev) => {
            setBusqueda(ev.target.value);
          }}
        />
        {eventos.length === 0 ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">{t.sinEventos}</p>
        ) : visibles.length === 0 ? (
          <p role="status" className="text-cuerpo-pequeno text-texto-secundario">
            {t.sinResultados}
          </p>
        ) : (
          <ul data-rol="eventos" className="flex flex-col divide-y divide-borde-sutil">
            {visibles.map((e) => (
              <li
                key={`${e.ocurridoEn}|${e.origen}|${e.idError ?? e.mensaje}`}
                className="flex flex-col gap-0.5 py-3"
              >
                <span className="text-sm text-texto-secundario">
                  {t.nivel[e.nivel]} · {e.origen} · {formatearInstante(e.ocurridoEn)}
                </span>
                <span className="text-cuerpo-pequeno break-words text-texto">{e.mensaje}</span>
                {e.idError === undefined ? null : (
                  <span className="text-sm text-texto-secundario">
                    {t.referencia}:{' '}
                    <code className="font-mono break-all" translate="no">
                      {e.idError}
                    </code>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
