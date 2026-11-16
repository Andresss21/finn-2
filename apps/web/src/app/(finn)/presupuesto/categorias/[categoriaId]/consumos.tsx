'use client';
// Consumos del detalle de categoría (FT-14, CA-14.1 a CA-14.3; C-52 §4, `docs/anexos/finn-detalle-de-categoria/`): del más
// reciente al más antiguo, por semana de lunes a domingo, con los filtros que haya y el día que se eligió en el calendario. El
// orden, los filtros, las semanas y el plegado son los de `logica/consumos.js` (portada a `formato/consumos-por-semana.ts`).
// [CH-223] La nota de cada fila dice los montos del DTO y la barrita dibuja su `cubiertoBp` (A6). La interfaz no suma ni calcula
// montos (PF-3): las semanas solo cuentan filas, sin subtotales.
import type { DetalleCategoria } from '@finn/dominio/selectores';
import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { duracionToken } from '../../../../../componentes/movimiento/use-salida';
import { Icono } from '../../../../../componentes/base/icono';
import { indice } from '../../../../../componentes/movimiento/indice';
import { Vacio } from '../../../../../componentes/base/vacio';
import { Monto } from '../../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import { formatearFechaTexto } from '../../../../../formato';
import {
  abierta,
  agrupar,
  explicarOrden,
  filtrar,
  filtrosVisibles,
  type FiltroConsumos,
} from '../../../../../formato/consumos-por-semana';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.consumos;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center px-2 font-bold text-enlace ${FOCO}`;
// L13: clases literales. La ficha elegida se invierte (`--texto`), como las pastillas de filtro (06-identidad-visual 2.3).
const FICHA_BASE = `inline-flex min-h-11 shrink-0 items-center rounded-pastilla px-4 text-etiqueta transition-colors duration-(--duracion-rapida) ease-(--curva-estandar) ${FOCO}`;
const FICHA = {
  elegida: `${FICHA_BASE} bg-texto font-bold text-fondo`,
  otra: `${FICHA_BASE} bg-superficie-hundida text-texto`,
};
// §8: el alto de la semana se abre o se cierra (`grid-template-rows` 1fr ↔ 0fr) y la flecha gira 180°. [CH-295] Corrección de la
// parte 1: en Safari (iPhone) la fila `0fr` seguía midiendo lo de la semana abierta (el mínimo `auto` de la pista toma el alto
// del contenido), así que quedaba un hueco del alto de las semanas plegadas. La pista va con mínimo 0 (`minmax(0, …)`) y, al
// terminar de cerrarse (o en el acto con movimiento reducido), el contenido sale del dibujo (`hidden`): una semana plegada no
// aporta alto en ningún navegador.
const PLEGABLE_BASE =
  'grid transition-[grid-template-rows] duration-(--duracion-normal) ease-(--curva-estandar)';
const PLEGABLE = {
  abierta: `${PLEGABLE_BASE} grid-rows-[minmax(0,1fr)]`,
  cerrada: `${PLEGABLE_BASE} grid-rows-[minmax(0,0fr)]`,
};
const REDUCIDO = '(prefers-reduced-motion: reduce)';
const GIRO = 'transition-transform duration-(--duracion-normal) ease-(--curva-estandar)';
const FLECHA = { abierta: `${GIRO} rotate-180`, cerrada: GIRO };
const SEMANA = `flex min-h-12 w-full items-center gap-3 text-left ${FOCO}`;
const QUITAR = `inline-flex size-11 items-center justify-center rounded-pastilla ${FOCO}`;
// [CH-295] C-52 §8: la sección entra en el sexto lugar del escalonado del detalle.
const LISTA = 'fz-entra-seccion flex scroll-mt-4 flex-col gap-2.5';
// La lista se funde con el filtro nuevo (§8); `key` la vuelve a montar.
const FUNDIDO = 'flex flex-col gap-3 animate-[fz-v-in_var(--duracion-normal)_var(--curva-entrada)]';
const NOTA = {
  cubierto: 'text-cuerpo-pequeno',
  debito: 'text-cuerpo-pequeno text-problema-texto',
  tarjeta: 'text-cuerpo-pequeno text-deuda-sin-respaldo-texto',
};
const SALTO: Readonly<Record<string, 1 | -1>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};
/** Sin período (un uso suelto de la lista), las semanas no se recortan. */
const SIN_RECORTE = { inicio: '0000-01-01', fin: '9999-12-31' };

type Consumo = DetalleCategoria['consumos'][number];

export function Consumos({
  consumos,
  volver,
  periodo = SIN_RECORTE,
  dia = null,
  diaTexto = '',
  alQuitarDia,
  anunciar,
  lista,
}: {
  /** En el orden del DTO (D2, del más antiguo al más reciente): la lista los da vuelta. */
  readonly consumos: DetalleCategoria['consumos'];
  /** La ruta de esta pantalla, para el `?volver=` del detalle de cada transacción (05 §3.3). */
  readonly volver: string;
  readonly periodo?: { readonly inicio: string; readonly fin: string };
  /** El día elegido en el calendario (`AAAA-MM-DD`) y su nombre para la píldora («Viernes 9 de oct»). */
  readonly dia?: string | null;
  readonly diaTexto?: string;
  readonly alQuitarDia?: () => void;
  /** La región de estado de la pantalla (§9). */
  readonly anunciar?: (texto: string) => void;
  /** Hasta dónde baja la página al elegir un día. */
  readonly lista?: RefObject<HTMLElement | null>;
}) {
  const [filtro, setFiltro] = useState<FiltroConsumos>('todos');
  const [elegidas, setElegidas] = useState<Record<string, boolean>>({});
  const fichas = useRef<HTMLDivElement>(null);
  const filtros = filtrosVisibles(consumos);
  const activo = filtros.some((f) => f.clave === filtro) ? filtro : 'todos';
  const semanas = agrupar(filtrar(consumos, activo, dia), periodo);
  const elegir = (clave: FiltroConsumos, texto: string): void => {
    setFiltro(clave);
    anunciar?.(texto);
  };
  const alTeclear = (e: KeyboardEvent<HTMLButtonElement>, k: number): void => {
    const paso = SALTO[e.key];
    if (paso === undefined) return;
    e.preventDefault();
    const destino = (k + paso + filtros.length) % filtros.length;
    const f = filtros[destino];
    if (f === undefined) return;
    elegir(f.clave, f.texto);
    fichas.current?.querySelectorAll<HTMLElement>('[role=radio]')[destino]?.focus();
  };

  return (
    <section ref={lista} data-seccion="consumos" className={LISTA} style={indice(6)}>
      <h2 className="flex items-baseline justify-between gap-3">
        <span className="text-titulo-seccion">{t.titulo}</span>
        <span data-cuantos className="text-cifra">
          {consumos.length}
        </span>
      </h2>
      {dia === null ? null : (
        <p
          data-dia-elegido={dia}
          className="inline-flex min-h-11 items-center gap-1 self-start rounded-pastilla bg-texto pl-4 text-etiqueta font-bold text-fondo animate-[fz-item_var(--duracion-normal)_var(--curva-entrada)]"
        >
          {diaTexto}
          <button type="button" aria-label={t.quitarDia} onClick={alQuitarDia} className={QUITAR}>
            <Icono nombre="x" tamano={18} />
          </button>
        </p>
      )}
      {filtros.length === 0 ? null : (
        <div
          ref={fichas}
          role="radiogroup"
          aria-label={t.filtros}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:none] md:mx-0 md:px-0"
        >
          {filtros.map((f, k) => (
            <button
              key={f.clave}
              type="button"
              role="radio"
              aria-checked={f.clave === activo}
              tabIndex={f.clave === activo ? 0 : -1}
              onClick={() => {
                elegir(f.clave, f.texto);
              }}
              onKeyDown={(e) => {
                alTeclear(e, k);
              }}
              className={f.clave === activo ? FICHA.elegida : FICHA.otra}
            >
              {f.texto}
            </button>
          ))}
        </div>
      )}
      {consumos.length === 0 ? (
        <Vacio titulo={t.vacio} texto={t.vacioTexto} icono="cero" />
      ) : semanas.length === 0 ? (
        <p className="rounded-contenedor bg-superficie px-4 py-6 text-center text-cuerpo-pequeno text-texto-secundario">
          {t.sinFiltro}
        </p>
      ) : (
        <div key={`${activo}-${dia ?? ''}`} className={FUNDIDO}>
          {explicarOrden(consumos) ? (
            <p data-orden-cobertura className="text-cuerpo-pequeno text-texto-secundario">
              {t.ordenCobertura}
            </p>
          ) : null}
          {semanas.map((s, k) => {
            const abre = abierta(s, k, consumos.length, activo, dia, elegidas);
            return (
              <div
                key={s.lunes}
                data-semana={s.lunes}
                className="rounded-contenedor bg-superficie px-3.5"
              >
                <button
                  type="button"
                  aria-expanded={abre}
                  onClick={() => {
                    setElegidas({ ...elegidas, [s.lunes]: !abre });
                  }}
                  className={SEMANA}
                >
                  <span className="flex-1 text-cuerpo font-semibold">{s.titulo}</span>
                  <span className="text-cuerpo-pequeno text-texto-secundario">{s.cuenta}</span>
                  <span aria-hidden="true" className={abre ? FLECHA.abierta : FLECHA.cerrada}>
                    <Icono nombre="chevD" tamano={18} />
                  </span>
                </button>
                <Plegable abre={abre}>
                  <ul className="flex flex-col divide-y divide-borde-sutil border-t border-borde-sutil">
                    {s.filas.map((x, j) => (
                      <Fila key={j} consumo={x} volver={volver} />
                    ))}
                  </ul>
                </Plegable>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * El cuerpo de una semana. Fases: abierta (`1fr`), cerrándose (`0fr`, el contenido todavía se ve mientras baja el alto), cerrada
 * (`hidden`) y abriéndose (el contenido vuelve con `0fr` y un cuadro después pasa a `1fr`, para que la transición tenga de dónde
 * partir). Con movimiento reducido no hay fases intermedias.
 */
function Plegable({ abre, children }: { readonly abre: boolean; readonly children: ReactNode }) {
  const [fase, setFase] = useState<'abierta' | 'cerrando' | 'cerrada' | 'abriendo'>(
    abre ? 'abierta' : 'cerrada',
  );
  const caja = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reducido = window.matchMedia(REDUCIDO).matches;
    if (abre) {
      if (fase === 'abierta' || fase === 'abriendo') return;
      if (reducido) {
        setFase('abierta');
        return;
      }
      setFase('abriendo');
      const cuadro = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFase('abierta');
        });
      });
      return () => {
        cancelAnimationFrame(cuadro);
      };
    }
    if (fase === 'cerrada' || fase === 'cerrando') return;
    if (reducido) {
      setFase('cerrada');
      return;
    }
    setFase('cerrando');
    // Si `transitionend` no llega (pestaña oculta), a la duración del token.
    const tope = window.setTimeout(() => {
      setFase('cerrada');
    }, duracionToken('--duracion-normal'));
    return () => {
      window.clearTimeout(tope);
    };
    // Solo se reevalúa cuando cambia `abre`; la fase la cambian este efecto y `transitionend`.
  }, [abre]);
  const expandida = fase === 'abierta';
  return (
    <div
      ref={caja}
      data-plegable={fase}
      className={expandida ? PLEGABLE.abierta : PLEGABLE.cerrada}
      inert={!abre}
      onTransitionEnd={(e) => {
        if (e.target === caja.current && fase === 'cerrando') setFase('cerrada');
      }}
    >
      <div className="min-h-0 overflow-hidden" hidden={fase === 'cerrada'}>
        {children}
      </div>
    </div>
  );
}

/** La fila de hoy (C-52 §4): fecha, comercio, «{cuenta} · débito / tarjeta», lo cubierto, la barrita y el monto. */
function Fila({ consumo: x, volver }: { readonly consumo: Consumo; readonly volver: string }) {
  const transaccionId = 'transaccionId' in x.origen ? x.origen.transaccionId : null;
  const nombre = x.comercio ?? (transaccionId === null ? t.condonacion : x.cuenta.nombre);
  const tono = x.medio === 'tarjeta' ? 'deuda-sin-respaldo' : 'problema';
  return (
    <li data-consumo={x.fecha} className="flex items-start gap-3 py-3">
      <span data-insignia-fecha className="flex w-12 shrink-0 flex-col items-center leading-none">
        <span className="text-rotulo text-texto-secundario">
          {formatearFechaTexto(x.fecha).split(' ')[1]}
        </span>
        <span className="text-cifra">{x.fecha.slice(8)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {transaccionId === null ? (
          <span className="font-semibold">{nombre}</span>
        ) : (
          <EnlaceFinn
            href={`/actividad/${transaccionId}?volver=${encodeURIComponent(volver)}`}
            className={ENLACE}
          >
            {nombre}
          </EnlaceFinn>
        )}
        <span className="text-cuerpo-pequeno text-texto-secundario">
          {x.cuenta.nombre} · {x.medio === 'tarjeta' ? t.medioTarjeta : t.medioDebito}
        </span>
        {x.noCubierto === 0 ? (
          <span data-nota-cobertura className={NOTA.cubierto}>
            {t.cubierto} <Monto centavos={x.cubierto} />
          </span>
        ) : (
          <span data-nota-cobertura className={x.medio === 'tarjeta' ? NOTA.tarjeta : NOTA.debito}>
            {t.cubierto} <Monto centavos={x.cubierto} estado={tono} />
            {' · '}
            {t.noCubierto} <Monto centavos={x.noCubierto} estado={tono} />
          </span>
        )}
        {x.montoNeto > 0 ? (
          <span
            aria-hidden="true"
            data-barrita-cobertura
            className="mt-1.5 flex h-[5px] overflow-hidden rounded-pastilla bg-superficie-hundida"
          >
            {x.cubiertoBp > 0 ? (
              <span
                data-segmento="cubierto"
                style={{ width: `${x.cubiertoBp / 100}%` }}
                className="bg-texto-secundario"
              />
            ) : null}
            {x.noCubierto === 0 ? null : (
              <span
                data-segmento="no-cubierto"
                className="flex-1 bg-[repeating-linear-gradient(135deg,var(--problema-borde)_0_3px,var(--problema-fondo)_3px_6px)]"
              />
            )}
          </span>
        ) : null}
      </span>
      <Monto centavos={x.montoNeto} rol="cifra" presentacion="salida" />
    </li>
  );
}
