'use client';
// Calendario de `EntradaFecha` (P1-03 del export, 05 §5.3): cuadrícula del mes con el patrón «date picker dialog» de la APG.
// Se carga perezoso al abrirlo (05 §13.1): no suma bytes a las rutas hasta que alguien lo pide. Solo ordena fechas con
// `FechaLocal`; no decide qué fecha vale (eso lo hace el campo) ni usa el reloj: el «hoy» viene del servidor.
import { FechaLocal } from '@finn/dominio/valores';
import { useEffect, useRef, useState } from 'react';
import { calendario as t } from '../../textos/calendario';
import { Icono } from '../base/icono';

export interface PropsCalendarioFecha {
  /** La fecha del campo; el calendario abre en su mes y la marca. */
  readonly inicial: FechaLocal;
  readonly hoy?: FechaLocal | undefined;
  readonly minima?: FechaLocal | undefined;
  readonly maxima?: FechaLocal | undefined;
  readonly alElegir: (fecha: FechaLocal) => void;
  /** `true` cuando se cierra con el teclado: el foco vuelve al botón del campo. */
  readonly alCerrar: (devolverFoco?: boolean) => void;
}

const LUNES = FechaLocal.desdeTexto('1970-01-05');
const columnaDe = (f: FechaLocal): number => ((FechaLocal.diasEntre(LUNES, f) % 7) + 7) % 7;

// Clases literales (L13).
const FLECHA =
  'flex size-11 cursor-pointer items-center justify-center rounded-pastilla bg-superficie-hundida text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const CELDA =
  'size-11 cursor-pointer rounded-pastilla text-sm tabular-nums text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco disabled:cursor-default disabled:text-texto-deshabilitado disabled:line-through aria-pressed:bg-accion aria-pressed:font-bold aria-pressed:text-texto-sobre-accion data-[hoy=true]:font-bold data-[hoy=true]:ring-2 data-[hoy=true]:ring-inset data-[hoy=true]:ring-foco';

export function CalendarioFecha({
  inicial,
  hoy: hoyRecibido,
  minima,
  maxima,
  alElegir,
  alCerrar,
}: PropsCalendarioFecha) {
  // El «hoy» del Encabezado queda en `<html data-hoy>` (05 §14.3): es el del servidor, nunca el del dispositivo.
  const [hoy] = useState<FechaLocal | undefined>(
    () => hoyRecibido ?? (document.documentElement.dataset['hoy'] as FechaLocal | undefined),
  );
  // El foco llega hasta el límite del rango y no pasa de ahí.
  const limitar = (f: FechaLocal): FechaLocal =>
    minima !== undefined && f < minima ? minima : maxima !== undefined && f > maxima ? maxima : f;
  const [foco, setFoco] = useState<FechaLocal>(() => limitar(inicial));
  const raiz = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(true);

  const habilitada = (f: FechaLocal): boolean => limitar(f) === f;
  const ir = (f: FechaLocal) => {
    moverFoco.current = true;
    setFoco(limitar(f));
  };

  // Al abrir y después de cada movimiento del teclado, el foco sigue al día.
  useEffect(() => {
    if (!moverFoco.current) return;
    moverFoco.current = false;
    raiz.current?.querySelector<HTMLElement>('[data-foco=true]')?.focus();
  }, [foco]);
  // Un toque o clic fuera lo cierra.
  useEffect(() => {
    const fuera = (e: PointerEvent) => {
      const caja = raiz.current?.parentElement;
      if (caja && !caja.contains(e.target as Node)) alCerrar();
    };
    document.addEventListener('pointerdown', fuera);
    return () => {
      document.removeEventListener('pointerdown', fuera);
    };
  }, [alCerrar]);

  const { anio, mes } = FechaLocal.partes(foco);
  const celdas: (number | null)[] = [
    ...Array.from({ length: columnaDe(FechaLocal.desdePartes(anio, mes, 1)) }, () => null),
    ...Array.from({ length: FechaLocal.diasDelMes(foco) }, (_, k) => k + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas = Array.from({ length: celdas.length / 7 }, (_, k) =>
    celdas.slice(k * 7, k * 7 + 7),
  );

  // El teclado vive en el documento: Esc cierra desde cualquier lugar del campo y las flechas actúan sobre la cuadrícula (APG).
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        alCerrar(true);
        return;
      }
      if (!(e.target as Element).closest('[role=grid]')) return;
      const col = columnaDe(foco);
      const saltos: Readonly<Record<string, FechaLocal>> = {
        ArrowLeft: FechaLocal.sumarDias(foco, -1),
        ArrowRight: FechaLocal.sumarDias(foco, 1),
        ArrowUp: FechaLocal.sumarDias(foco, -7),
        ArrowDown: FechaLocal.sumarDias(foco, 7),
        Home: FechaLocal.sumarDias(foco, -col),
        End: FechaLocal.sumarDias(foco, 6 - col),
        PageUp: FechaLocal.sumarMeses(foco, e.shiftKey ? -12 : -1),
        PageDown: FechaLocal.sumarMeses(foco, e.shiftKey ? 12 : 1),
      };
      const destino = saltos[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      ir(destino);
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
    };
  });

  return (
    <div
      ref={raiz}
      role="dialog"
      aria-label={t.titulo}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex w-max flex-col gap-3 rounded-2xl bg-superficie p-4 shadow-elevacion-2 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mx-0 sm:mt-2"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={t.mesAnterior}
          className={FLECHA}
          onClick={() => {
            ir(FechaLocal.sumarMeses(foco, -1));
          }}
        >
          <Icono nombre="arrowL" tamano={18} />
        </button>
        <span id="calendario-mes" aria-live="polite" className="font-bold capitalize">
          {`${t.meses[mes - 1] ?? ''} ${anio}`}
        </span>
        <button
          type="button"
          aria-label={t.mesSiguiente}
          className={FLECHA}
          onClick={() => {
            ir(FechaLocal.sumarMeses(foco, 1));
          }}
        >
          <Icono nombre="arrowR" tamano={18} />
        </button>
      </div>
      <div role="grid" aria-labelledby="calendario-mes" className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-[repeat(7,2.75rem)]">
          {t.iniciales.map((letra, k) => (
            <span
              key={t.dias[k]}
              role="columnheader"
              aria-label={t.dias[k]}
              className="text-center text-xs font-semibold uppercase text-texto-terciario"
            >
              {letra}
            </span>
          ))}
        </div>
        {semanas.map((semana, s) => (
          <div key={s} role="row" className="grid grid-cols-[repeat(7,2.75rem)] gap-y-1">
            {semana.map((dia, c) => {
              if (dia === null) return <span key={c} role="gridcell" />;
              const f = FechaLocal.desdePartes(anio, mes, dia);
              const ok = habilitada(f);
              const esHoy = f === hoy;
              const enfocada = f === foco;
              const nombre = `${dia} de ${t.meses[mes - 1] ?? ''}${esHoy ? `, ${t.esHoy}` : ''}${ok ? '' : `, ${t.noDisponible}`}`;
              return (
                <span key={c} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    aria-label={nombre}
                    aria-pressed={f === inicial}
                    aria-current={esHoy ? 'date' : undefined}
                    data-hoy={esHoy}
                    data-foco={enfocada}
                    disabled={!ok}
                    tabIndex={enfocada ? 0 : -1}
                    className={CELDA}
                    onClick={() => {
                      alElegir(f);
                    }}
                  >
                    {dia}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {hoy !== undefined && habilitada(hoy) ? (
        <div className="flex items-center justify-end border-t border-borde-sutil pt-2">
          <button
            type="button"
            className="min-h-11 min-w-11 cursor-pointer px-2 text-sm font-bold text-enlace focus-visible:outline-3 focus-visible:outline-foco"
            onClick={() => {
              alElegir(hoy);
            }}
          >
            {t.hoy}
          </button>
        </div>
      ) : null}
    </div>
  );
}
