'use client';
// Contratos de navegación de 05 §3.3 (FE-29, FE-30) con la forma de 06-identidad-visual §3: barra inferior con la Bandeja
// al centro en teléfono, barra lateral en computadora y hoja «Más secciones» (N5: botón y enlace, dos interacciones).
// Los contadores van dentro del nombre accesible del enlace y no se anuncian al cambiar (11.3).
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { navegacion } from '../../textos/navegacion';
import { Icono, type NombreIcono } from '../base/icono';
import { Marca } from '../marco/marca';
import { indice } from '../movimiento/indice';
import { Contador } from './contador';
import { EnlaceFinn } from './enlace-finn';
import { precargar, SuperpuestoDiferido } from './hoja-diferida';
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
  presupuesto: 'grid',
  bandeja: 'inbox',
  actividad: 'activity',
  cuentas: 'wallet',
  reportes: 'chart',
  metas: 'target',
  programadas: 'repeat',
  'por-cobrar': 'user',
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

// Mapa de clases literales (L13) de los contadores a la derecha de una fila (export K1): en la barra lateral, Bandeja en `marca`
// (24 px) y Notificaciones en `accion` (20 px); en la hoja «Más secciones», 22 px en `accion`.
const CONTADORES_FILA = {
  bandeja:
    'ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-pastilla bg-marca px-1.5 text-xs leading-none font-extrabold text-texto-sobre-marca after:content-[attr(data-contador)]',
  notificaciones:
    'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-pastilla bg-accion px-1.25 text-xs leading-none font-extrabold text-texto-sobre-accion after:content-[attr(data-contador)]',
  hoja: 'ml-auto inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-pastilla bg-accion px-1.5 text-xs leading-none font-extrabold text-texto-sobre-accion after:content-[attr(data-contador)]',
} as const;

/** Contador de una fila (06-identidad-visual 3.2 y 2.17): a la derecha. El número ya está en el nombre del enlace. */
function ContadorFila({
  valor,
  forma,
}: {
  readonly valor: number | null;
  readonly forma: keyof typeof CONTADORES_FILA;
}) {
  if (valor === null || valor <= 0) return null;
  return (
    <span
      aria-hidden="true"
      data-contador={valor > 99 ? navegacion.masDeNoventaYNueve : valor}
      className={CONTADORES_FILA[forma]}
    />
  );
}

const PESTANA =
  'group relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-texto-secundario aria-[current=page]:font-bold aria-[current=page]:text-texto';
const RAYA =
  'absolute top-0 h-0.75 w-7 rounded-b-sm bg-accion opacity-0 group-aria-[current=page]:opacity-100';
// Mapa de clases literales (L13): fila alta (principal) y baja (secundaria, texto chico). Las dos de 44 px: el diseño pide 40
// para la baja, pero 05 §11.5 (FE-47) exige 44 sin una excepción registrada (Contradicción en CH-109).
const FILAS = {
  alta: 'group text-cuerpo relative flex min-h-11 items-center gap-3 rounded-control px-3 font-medium text-texto-secundario aria-[current=page]:bg-superficie-hundida aria-[current=page]:font-bold aria-[current=page]:text-texto',
  baja: 'group text-cuerpo-pequeno relative flex min-h-11 items-center gap-3 rounded-control px-3 text-texto-secundario aria-[current=page]:bg-superficie-hundida aria-[current=page]:font-bold aria-[current=page]:text-texto',
} as const;

function BarraInferior({ secciones, seccionActiva, contadores }: PropsNavegacionApp) {
  return (
    <nav
      aria-label={navegacion.principal}
      data-marco-barra
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde-sutil bg-superficie px-1 pt-1.5 md:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.375rem)' }}
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
                    punto="icono"
                    className="group text-etiqueta relative flex flex-col items-center gap-0.5 text-xs font-bold text-texto"
                  >
                    <span className="relative -mt-6.5 inline-flex size-15.5 items-center justify-center rounded-identidad border-4 border-fondo bg-marca text-texto-sobre-marca shadow-elevacion-2 group-aria-[current=page]:bg-accion">
                      {/* Mientras hay movimientos por revisar, dos halos desfasados (06-identidad-visual 3.1; decorativos). */}
                      {valor !== null && valor > 0 ? (
                        <>
                          <span aria-hidden="true" className="finn-halo" />
                          <span aria-hidden="true" className="finn-halo" />
                        </>
                      ) : null}
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
                  punto="icono"
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
        punto="fila"
        className={FILAS[alta ? 'alta' : 'baja']}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-2.5 -left-3.5 w-0.75 bg-accion opacity-0 group-aria-[current=page]:opacity-100"
        />
        <Icono nombre={ICONOS[seccion.id]} tamano={alta ? 20 : 18} />
        {seccion.etiqueta}
        <ContadorFila
          valor={valor}
          forma={seccion.id === 'bandeja' ? 'bandeja' : 'notificaciones'}
        />
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-62 flex-col gap-5.5 overflow-y-auto border-r border-borde-sutil bg-superficie px-3.5 py-6 md:flex">
      <div className="px-2">
        <Marca />
      </div>
      {registrar}
      <nav aria-label={navegacion.principal} className="flex flex-col gap-5.5">
        <ul className="flex flex-col gap-0.5">
          {secciones.filter((s) => s.nivel === 'principal').map(fila(true))}
        </ul>
        <div>
          <p className="text-rotulo px-3 pb-1.5 text-texto-terciario">{navegacion.masRotulo}</p>
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
  useEffect(() => {
    // Un momento después de hidratar (tope de 2 s, como la Bandeja, 05 §13.3): la primera apertura ya tiene el módulo
    const id = setTimeout(precargar, 2000);
    return () => {
      clearTimeout(id);
    };
  }, []);
  return (
    <>
      <button
        type="button"
        aria-label={navegacion.secundarias}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        onPointerEnter={precargar}
        onPointerDown={precargar}
        onFocus={precargar}
        onClick={() => {
          setAbiertaEn(pathname);
        }}
        className="inline-flex size-11 items-center justify-center rounded-pastilla text-texto"
      >
        <Icono nombre="menu" tamano={24} />
      </button>
      {abierta ? (
        <SuperpuestoDiferido
          titulo={navegacion.secundarias}
          desde="abajo"
          alCerrar={() => {
            setAbiertaEn(null);
          }}
        >
          {/* Filas de 52 con separador: ícono 20, nombre, contador a la derecha y `chevR` (06-identidad-visual 2.17, export K1). */}
          <ul className="-mx-5 -mt-3 flex flex-col pb-4">
            {secciones
              .filter((s) => s.nivel === 'secundaria')
              .map((s, i) => {
                const { valor, nombre } = conContador(s.id, s.etiqueta, contadores);
                return (
                  <li key={s.id} className="fz-opcion" style={indice(i)}>
                    <EnlaceFinn
                      href={s.ruta}
                      aria-label={nombre}
                      aria-current={s.id === seccionActiva ? 'page' : undefined}
                      className="text-cuerpo flex min-h-13 items-center gap-3 border-b border-borde-sutil px-4 text-texto aria-[current=page]:font-bold"
                    >
                      <Icono nombre={ICONOS[s.id]} tamano={20} className="text-texto-secundario" />
                      <span className="flex-1">{s.etiqueta}</span>
                      <ContadorFila valor={valor} forma="hoja" />
                      <Icono nombre="chevR" tamano={16} className="text-texto-terciario" />
                    </EnlaceFinn>
                  </li>
                );
              })}
          </ul>
        </SuperpuestoDiferido>
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
