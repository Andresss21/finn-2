'use client';
// `Marco` (05 §1.2, §1.6, FE-06; 06-identidad-visual §3; portado del export K1 y de la entrega 2 del diseño, CH-109): lo que
// rodea a toda pantalla de `(finn)`. Contiene el `ProveedorEncabezado`, la barra superior, la navegación entre secciones
// (barra inferior y lateral), el enlace «Saltar al contenido» y el indicador global de navegación en curso (FE-39). No mueve
// el foco al navegar (11.2).
// - Teléfono: el título de la barra es el `h1` de la página, que `globals.css` dibuja dentro de la barra fija (así sale del
//   servidor con la página). En una pantalla hija (`volverDeRuta`), «Volver a…» a la izquierda y campana + «Más acciones»
//   a la derecha; en las demás, Registrar, campana y «Más secciones». Un flujo (`PaginaFlujo`) oculta las barras.
// - Computadora: campana y «Más acciones» arriba a la derecha del contenido, que va alineado a la izquierda (globals.css).
import { usePathname, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useConexion } from '../../cliente/useConexion';
import { useRefrescoAutomatico } from '../../cliente/useRefrescoAutomatico';
import { navegacion } from '../../textos/navegacion';
import { Icono, type NombreIcono } from '../base/icono';
import { AccesoRegistrar, rutaRegistrar } from '../navegacion/acceso-registrar';
import { Contador } from '../navegacion/contador';
import {
  ContextoNavegacionPendiente,
  EnlaceFinn,
  EVENTO_SIN_CONEXION,
} from '../navegacion/enlace-finn';
import { precargar, SuperpuestoDiferido } from '../navegacion/hoja-diferida';
import { useRefrescar } from '../navegacion/use-refrescar';
import { MasSecciones, NavegacionApp } from '../navegacion/navegacion-app';
import { SECCIONES, seccionDeRuta, volverDeRuta } from '../navegacion/secciones';
import { ProveedorEncabezado, useEncabezado } from './proveedor-encabezado';

/** Una acción de «Más acciones» (P1-04): un enlace a su flujo o, sin `ruta` o con `motivo`, deshabilitada con el motivo. */
export interface AccionPantalla {
  readonly etiqueta: string;
  readonly ruta?: string;
  readonly motivo?: string;
  readonly icono?: NombreIcono;
  /** Eliminar: al final, separada por una línea y en `peligro`. */
  readonly peligro?: boolean;
}
interface AccionesPublicadas {
  readonly titulo: string;
  readonly acciones: readonly AccionPantalla[];
}
const ContextoAcciones = createContext<(a: AccionesPublicadas | null) => void>(() => undefined);

/** La pantalla hija publica sus acciones, como `PublicarEncabezado` (1.6); sin salida visible. Sin acciones, no hay menú. */
export function PublicarAcciones(props: AccionesPublicadas) {
  const publicar = useContext(ContextoAcciones);
  const { titulo, acciones } = props;
  useEffect(() => {
    publicar({ titulo, acciones });
    return () => {
      publicar(null);
    };
  }, [publicar, titulo, acciones]);
  return null;
}

export function Marco({
  children,
  superpuesto,
}: {
  readonly children: ReactNode;
  readonly superpuesto?: ReactNode;
}) {
  return (
    <ProveedorEncabezado>
      <CuerpoDelMarco superpuesto={superpuesto}>{children}</CuerpoDelMarco>
    </ProveedorEncabezado>
  );
}

function CuerpoDelMarco({
  children,
  superpuesto,
}: {
  readonly children: ReactNode;
  readonly superpuesto: ReactNode;
}) {
  const pathname = usePathname();
  const busqueda = useSearchParams();
  const { encabezado, recibidoEn } = useEncabezado();
  const { enLinea } = useConexion();
  // Un clic bloqueado por falta de conexión cambia el texto del aviso, que el lector de pantalla anuncia (8.5).
  const [bloqueada, setBloqueada] = useState(false);
  useEffect(() => {
    const alBloquear = (): void => {
      setBloqueada(true);
    };
    window.addEventListener(EVENTO_SIN_CONEXION, alBloquear);
    return () => {
      window.removeEventListener(EVENTO_SIN_CONEXION, alBloquear);
    };
  }, []);
  useEffect(() => {
    if (enLinea) setBloqueada(false);
  }, [enLinea]);
  const refrescar = useRefrescar();
  useRefrescoAutomatico({ hoy: encabezado?.hoy ?? null, recibidoEn, refrescar });
  const [pendientes, setPendientes] = useState<ReadonlySet<string>>(new Set());
  const marcar = useCallback((id: string, pendiente: boolean) => {
    setPendientes((antes) => {
      if (antes.has(id) === pendiente) return antes;
      const despues = new Set(antes);
      if (pendiente) despues.add(id);
      else despues.delete(id);
      return despues;
    });
  }, []);
  const [acciones, setAcciones] = useState<AccionesPublicadas | null>(null);
  // 05 §14.3: las pruebas esperan este atributo antes de interactuar.
  useEffect(() => {
    document.documentElement.setAttribute('data-hidratado', 'si');
  }, []);

  // `null` = sin dato todavía (1.6): ningún cero inventado.
  const contadores = {
    bandeja: encabezado?.bandejaPorRevisar ?? null,
    notificaciones: encabezado?.notificacionesNoLeidas ?? null,
  };
  const comun = { secciones: SECCIONES, seccionActiva: seccionDeRuta(pathname), contadores };
  const ruta = rutaRegistrar(pathname);
  const volver = volverDeRuta(pathname, busqueda);
  const conAcciones = acciones !== null && acciones.acciones.length > 0;

  return (
    <ContextoNavegacionPendiente value={marcar}>
      <a
        href="#contenido"
        className="text-etiqueta sr-only z-50 rounded-control bg-superficie-elevada px-4 py-3 text-texto focus:not-sr-only focus:inline-flex focus:min-h-11 focus:items-center focus:px-4 focus:py-3 focus:fixed focus:top-2 focus:left-2"
      >
        {navegacion.saltar}
      </a>
      {enLinea ? null : (
        <div
          role="status"
          className="text-etiqueta fixed inset-x-0 top-15 z-40 bg-superficie-elevada px-5 py-2 text-center text-texto md:top-0 md:left-62"
        >
          {bloqueada ? navegacion.sinConexionNavegacion : navegacion.sinConexion}
        </div>
      )}
      {pendientes.size > 0 ? (
        <div
          role="progressbar"
          aria-label={navegacion.navegando}
          className="fixed inset-x-0 top-0 z-50 h-0.75 animate-pulse bg-accion"
        />
      ) : null}
      <ContextoAcciones value={setAcciones}>
        <NavegacionApp {...comun} registrar={<AccesoRegistrar ruta={ruta} variante="lateral" />} />
        <div
          id="contenido"
          tabIndex={-1}
          data-barra={volver === null ? 'principal' : 'hija'}
          data-acciones={conAcciones ? '' : undefined}
          className="relative pt-15 pb-28 outline-none md:pt-0 md:pb-0 md:pl-62"
        >
          <header
            data-marco-barra
            className="fixed inset-x-0 top-0 z-30 flex h-15 items-center gap-1 bg-fondo pr-2 pl-5 md:absolute md:top-8 md:right-12 md:left-auto md:h-11 md:gap-2.5 md:bg-transparent md:p-0"
          >
            {volver === null ? null : (
              <EnlaceFinn
                href={volver.ruta}
                aria-label={volver.etiqueta}
                className="-ml-2 inline-flex size-11 items-center justify-center text-texto md:hidden"
              >
                <Icono nombre="arrowL" tamano={22} />
              </EnlaceFinn>
            )}
            <span className="flex-1 md:hidden" />
            {volver === null ? (
              <span className="flex w-27.5 justify-end md:hidden">
                <AccesoRegistrar ruta={ruta} variante="barra" />
              </span>
            ) : null}
            {conAcciones ? <MasAcciones {...acciones} /> : null}
            <Campana valor={contadores.notificaciones} />
            {volver === null ? (
              <span className="md:hidden">
                <MasSecciones {...comun} />
              </span>
            ) : null}
          </header>
          {children}
        </div>
      </ContextoAcciones>
      {superpuesto}
    </ContextoNavegacionPendiente>
  );
}

/**
 * La campana (06-identidad-visual 3.1, N7). `/notificaciones` no existe todavía (FT-69): en lugar de enlazar a una ruta que
 * daría «Esto ya no existe.», abre el panel diferido desde arriba (la forma de CF-23) con el pie de 2.17.
 */
function Campana({ valor }: { readonly valor: number | null }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={navegacion.notificaciones(valor)}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        onPointerEnter={precargar}
        onFocus={precargar}
        onClick={() => {
          setAbierta(true);
        }}
        className="relative inline-flex size-11 items-center justify-center rounded-pastilla text-texto md:bg-superficie-hundida"
      >
        <Icono nombre="bell" tamano={22} />
        <Contador valor={valor} forma="campana" />
      </button>
      {abierta ? (
        <SuperpuestoDiferido
          titulo={navegacion.secciones.notificaciones}
          desde="arriba"
          alCerrar={() => {
            setAbierta(false);
          }}
        >
          <p className="text-cuerpo-pequeno mb-3 flex gap-2.5 rounded-contenedor bg-superficie-hundida p-3.5 text-texto-secundario">
            <Icono nombre="info" tamano={18} className="mt-0.5 shrink-0" />
            {navegacion.notificacionesPie}
          </p>
        </SuperpuestoDiferido>
      ) : null}
    </>
  );
}

// Mapa de clases literales (L13) de las filas del menú: la no disponible en `texto-deshabilitado`; Eliminar, separada por
// una línea y en `peligro` (P1-04).
const ITEMS = {
  activa: 'flex w-full items-start gap-3 px-4 py-3 text-left text-texto',
  peligro:
    'flex w-full items-start gap-3 border-t border-borde-sutil px-4 py-3 text-left text-peligro',
  inactiva: 'flex w-full items-start gap-3 px-4 py-3 text-left text-texto-deshabilitado',
  inactivaPeligro:
    'flex w-full items-start gap-3 border-t border-borde-sutil px-4 py-3 text-left text-texto-deshabilitado',
} as const;

/**
 * «Más acciones» de una pantalla hija (menú de acciones de K2; P1-04 de la entrega 2): tres puntos en la barra del teléfono y
 * «Más acciones» junto a la campana en computadora. Flechas para moverse, Escape (o tocar fuera) cierra y devuelve el foco.
 */
function MasAcciones({ titulo, acciones }: AccionesPublicadas) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const items = (): HTMLElement[] => [
    ...(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []),
  ];
  useEffect(() => {
    if (!abierto) return;
    items()[0]?.focus();
    const alTocar = (e: PointerEvent): void => {
      const dentro = e.target instanceof Node && menu.current?.parentElement?.contains(e.target);
      if (dentro !== true) setAbierto(false);
    };
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);
  const alTeclear = (e: KeyboardEvent): void => {
    const lista = items();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      setAbierto(false);
      boton.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const paso = e.key === 'ArrowDown' ? 1 : lista.length - 1;
      lista[(i + paso) % lista.length]?.focus();
    } else if (e.key === 'Tab') setAbierto(false);
  };
  return (
    <div className="relative max-md:order-last">
      <button
        ref={boton}
        type="button"
        aria-label={navegacion.masAcciones}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => {
          setAbierto(!abierto);
        }}
        className="text-etiqueta inline-flex size-11 items-center justify-center gap-2 rounded-pastilla font-bold text-texto aria-expanded:bg-superficie-hundida md:w-auto md:bg-superficie-hundida md:px-4"
      >
        <Icono nombre="more" tamano={20} />
        <span className="max-md:hidden">{navegacion.masAcciones}</span>
      </button>
      {abierto ? (
        <div
          ref={menu}
          role="menu"
          tabIndex={-1}
          aria-label={navegacion.masAcciones}
          onKeyDown={alTeclear}
          className="absolute top-12 right-0 z-40 w-75 max-w-[calc(100vw-2rem)] overflow-hidden rounded-contenedor bg-superficie py-1 shadow-elevacion-2"
        >
          <p className="text-rotulo px-4 pt-3 pb-1 text-texto-secundario">{titulo}</p>
          {acciones.map((a) => {
            const contenido = (
              <>
                {a.icono === undefined ? null : (
                  <Icono nombre={a.icono} tamano={18} className="mt-0.5" />
                )}
                <span className="text-cuerpo flex flex-col gap-0.5">
                  {a.etiqueta}
                  {a.motivo === undefined ? null : (
                    <span className="text-cuerpo-pequeno text-texto-secundario">{a.motivo}</span>
                  )}
                </span>
              </>
            );
            const peligro = a.peligro === true;
            return a.ruta === undefined || a.motivo !== undefined ? (
              <div
                key={a.etiqueta}
                role="menuitem"
                aria-disabled="true"
                tabIndex={-1}
                className={ITEMS[peligro ? 'inactivaPeligro' : 'inactiva']}
              >
                {contenido}
              </div>
            ) : (
              <EnlaceFinn
                key={a.etiqueta}
                href={a.ruta}
                role="menuitem"
                tabIndex={-1}
                className={ITEMS[peligro ? 'peligro' : 'activa']}
              >
                {contenido}
              </EnlaceFinn>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
