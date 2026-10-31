'use client';
// Contratos de navegación de 05 §3.3 (FE-29, FE-30) con la forma de 06-identidad-visual §3: barra inferior con la Bandeja
// al centro en teléfono, barra lateral en computadora y hoja «Más secciones» (N5: botón y enlace, dos interacciones).
// Los contadores van dentro del nombre accesible del enlace y no se anuncian al cambiar (11.3).
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { navegacion } from '../../textos/navegacion';
import { Icono, type NombreIcono } from '../base/icono';
import { Superpuesto } from '../marco/superpuesto';
import { EnlaceFinn } from './enlace-finn';
import type { IdSeccion, Seccion } from './secciones';

export interface Contadores {
  readonly bandeja: number | null;
  readonly notificaciones: number | null;
}

interface PropsNavegacionApp {
  readonly secciones: readonly Seccion[];
  readonly seccionActiva: IdSeccion | null;
  readonly contadores: Contadores;
}

const ICONOS: Record<IdSeccion, NombreIcono> = {
  inicio: 'home',
  presupuesto: 'env',
  bandeja: 'inbox',
  actividad: 'activity',
  cuentas: 'bank',
  reportes: 'chart',
  metas: 'target',
  programadas: 'repeat',
  'por-cobrar': 'in',
  reglas: 'filter',
  notificaciones: 'bell',
  ajustes: 'gear',
};

/** El contador de una sección (solo la Bandeja y Notificaciones lo tienen) y el nombre accesible con él (3.3). */
function conContador(id: IdSeccion, etiqueta: string, c: Contadores) {
  if (id === 'bandeja') return { valor: c.bandeja, nombre: navegacion.bandeja(c.bandeja) };
  if (id === 'notificaciones')
    return { valor: c.notificaciones, nombre: navegacion.notificaciones(c.notificaciones) };
  return { valor: null, nombre: etiqueta };
}

/** Círculo con el número (06-identidad-visual 3.1). Sin dato o en cero no se dibuja; el número ya está en el nombre. */
export function Contador({ valor }: { readonly valor: number | null }) {
  if (valor === null || valor <= 0) return null;
  return (
    <span
      aria-hidden="true"
      data-contador={valor}
      className="absolute -top-1.5 -right-1.5 inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-pastilla border-2 border-fondo bg-accion px-1 text-[0.65rem] leading-none font-bold text-texto-sobre-accion"
    >
      {valor > 99 ? navegacion.masDeNoventaYNueve : valor}
    </span>
  );
}

const PESTANA =
  'group relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-texto-secundario aria-[current=page]:font-bold aria-[current=page]:text-texto';
const RAYA =
  'absolute top-0 h-0.75 w-7 rounded-b-sm bg-accion opacity-0 group-aria-[current=page]:opacity-100';
// Mapa de clases literales (L13): fila alta (principal) y baja (secundaria).
const FILAS = {
  alta: 'group text-etiqueta relative flex h-11 items-center gap-3 rounded-control px-3 text-texto aria-[current=page]:bg-superficie-hundida aria-[current=page]:font-bold',
  baja: 'group text-etiqueta relative flex h-10 items-center gap-3 rounded-control px-3 text-texto aria-[current=page]:bg-superficie-hundida aria-[current=page]:font-bold',
} as const;

function BarraInferior({ secciones, seccionActiva, contadores }: PropsNavegacionApp) {
  return (
    <nav
      aria-label={navegacion.principal}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde-sutil bg-superficie px-1 pt-1.5 md:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <ul className="flex items-end">
        {secciones
          .filter((s) => s.nivel === 'principal')
          .map((s) => {
            const { valor, nombre } = conContador(s.id, s.etiqueta, contadores);
            const activa = s.id === seccionActiva ? 'page' : undefined;
            if (s.id === 'bandeja')
              return (
                <li key={s.id} className="flex-1">
                  <EnlaceFinn
                    href={s.ruta}
                    aria-label={nombre}
                    aria-current={activa}
                    className="group text-etiqueta flex flex-col items-center gap-0.5 text-xs font-bold text-texto"
                  >
                    <span className="relative -mt-7 inline-flex size-15.5 items-center justify-center rounded-2xl border-4 border-fondo bg-marca text-texto-sobre-marca shadow-elevacion-2 group-aria-[current=page]:bg-accion">
                      <Icono nombre={ICONOS[s.id]} tamano={24} />
                      <Contador valor={valor} />
                    </span>
                    {s.etiqueta}
                  </EnlaceFinn>
                </li>
              );
            return (
              <li key={s.id} className="flex-1">
                <EnlaceFinn
                  href={s.ruta}
                  aria-label={nombre}
                  aria-current={activa}
                  className={PESTANA}
                >
                  <span aria-hidden="true" className={RAYA} />
                  <Icono nombre={ICONOS[s.id]} tamano={22} />
                  {s.etiqueta}
                </EnlaceFinn>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

function FilaLateral({
  seccion,
  activa,
  contadores,
  alta,
}: {
  readonly seccion: Seccion;
  readonly activa: boolean;
  readonly contadores: Contadores;
  readonly alta: boolean;
}) {
  const { valor, nombre } = conContador(seccion.id, seccion.etiqueta, contadores);
  return (
    <li>
      <EnlaceFinn
        href={seccion.ruta}
        aria-label={nombre}
        aria-current={activa ? 'page' : undefined}
        className={FILAS[alta ? 'alta' : 'baja']}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-0 w-0.75 rounded-pastilla bg-accion opacity-0 group-aria-[current=page]:opacity-100"
        />
        <span className="relative inline-flex">
          <Icono nombre={ICONOS[seccion.id]} tamano={20} />
          <Contador valor={valor} />
        </span>
        {seccion.etiqueta}
      </EnlaceFinn>
    </li>
  );
}

function BarraLateral({
  secciones,
  seccionActiva,
  contadores,
  registrar,
}: PropsNavegacionApp & { readonly registrar: ReactNode }) {
  const fila = (alta: boolean) => (s: Seccion) => (
    <FilaLateral
      key={s.id}
      seccion={s}
      activa={s.id === seccionActiva}
      contadores={contadores}
      alta={alta}
    />
  );
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-62 flex-col gap-4 overflow-y-auto border-r border-borde-sutil bg-superficie px-3.5 py-6 md:flex">
      <div className="flex items-center gap-2.5 px-1">
        <span
          aria-hidden="true"
          className="text-titulo-seccion inline-flex size-8.5 items-center justify-center rounded-control bg-marca text-texto-sobre-marca"
        >
          {navegacion.marca.charAt(0)}
        </span>
        <span className="text-titulo-seccion">{navegacion.marca}</span>
      </div>
      {registrar}
      <nav aria-label={navegacion.principal} className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1">
          {secciones.filter((s) => s.nivel === 'principal').map(fila(true))}
        </ul>
        <div>
          <p className="text-rotulo px-3 pb-1 text-texto-terciario">{navegacion.masRotulo}</p>
          <ul className="flex flex-col gap-0.5">
            {secciones.filter((s) => s.nivel === 'secundaria').map(fila(false))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

/** `NavegacionApp` (3.3): barra inferior en teléfono y lateral en computadora; `registrar` es el `AccesoRegistrar` lateral. */
export function NavegacionApp(props: PropsNavegacionApp & { readonly registrar: ReactNode }) {
  return (
    <>
      <BarraInferior {...props} />
      <BarraLateral {...props} />
    </>
  );
}

/** Botón ☰ de la barra superior: abre la hoja «Más secciones» con las secundarias. Se cierra al cambiar de ruta. */
export function MasSecciones({ secciones, seccionActiva, contadores }: PropsNavegacionApp) {
  const pathname = usePathname();
  const [abiertaEn, setAbiertaEn] = useState<string | null>(null);
  const abierta = abiertaEn === pathname;
  return (
    <>
      <button
        type="button"
        aria-label={navegacion.secundarias}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        onClick={() => {
          setAbiertaEn(pathname);
        }}
        className="inline-flex size-11 items-center justify-center rounded-pastilla text-texto"
      >
        <Icono nombre="menu" tamano={24} />
      </button>
      {abierta ? (
        <Superpuesto
          titulo={navegacion.secundarias}
          desde="abajo"
          alCerrar={() => {
            setAbiertaEn(null);
          }}
        >
          <ul className="flex flex-col pb-4">
            {secciones
              .filter((s) => s.nivel === 'secundaria')
              .map((s) => {
                const { valor, nombre } = conContador(s.id, s.etiqueta, contadores);
                return (
                  <li key={s.id}>
                    <EnlaceFinn
                      href={s.ruta}
                      aria-label={nombre}
                      aria-current={s.id === seccionActiva ? 'page' : undefined}
                      className="group text-cuerpo flex min-h-12 items-center gap-3 rounded-control px-2 text-texto aria-[current=page]:font-bold"
                    >
                      <span className="relative inline-flex">
                        <Icono nombre={ICONOS[s.id]} tamano={22} />
                        <Contador valor={valor} />
                      </span>
                      {s.etiqueta}
                    </EnlaceFinn>
                  </li>
                );
              })}
          </ul>
        </Superpuesto>
      ) : null}
    </>
  );
}

/** `VolverA` (3.3, N8): enlace al padre de un detalle. Lo usan los detalles; los flujos usan `cerrarFlujo()`. */
export function VolverA({ ruta, etiqueta }: { readonly ruta: string; readonly etiqueta: string }) {
  return (
    <EnlaceFinn
      href={ruta}
      className="text-cuerpo-pequeno inline-flex min-h-11 items-center gap-1 text-enlace"
    >
      <Icono nombre="arrowL" tamano={18} />
      {etiqueta}
    </EnlaceFinn>
  );
}
