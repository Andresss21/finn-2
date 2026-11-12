'use client';
// `Marco` (05 §1.2, §1.6, FE-06; 06-identidad-visual §3; portado del export K1 y de la entrega 2 del diseño, CH-109): lo que
// rodea a toda pantalla de `(finn)`. Contiene el `ProveedorEncabezado`, la barra superior, la navegación entre secciones
// (barra inferior y lateral), el enlace «Saltar al contenido» y el indicador global de navegación en curso (FE-39). No mueve
// el foco al navegar (11.2).
// Teléfono: el título es el `h1` de la página, que `globals.css` pone en la barra; una hija (`volverDeRuta`) lleva «Volver
// a…» y la campana (más «Más acciones» si la pantalla publica `PublicarAcciones`, CH-115), las demás Registrar, campana y ☰;
// `PaginaFlujo` oculta las barras. Computadora: campana (y «Más acciones») arriba a la derecha.
import { usePathname, useSearchParams } from 'next/navigation';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useConexion } from '../../cliente/useConexion';
import { useRefrescoAutomatico } from '../../cliente/useRefrescoAutomatico';
import { navegacion } from '../../textos/navegacion';
import { Icono } from '../base/icono';
import { AccesoRegistrar, rutaRegistrar } from '../navegacion/acceso-registrar';
import { Contador } from '../navegacion/contador';
import {
  ContextoNavegacionPendiente,
  EnlaceFinn,
  EVENTO_SIN_CONEXION,
} from '../navegacion/enlace-finn';
import { direccionDeEntrada } from '../navegacion/direccion-entrada';
import { useRefrescar } from '../navegacion/use-refrescar';
import { EVENTO_ARRASTRE } from './arrastre';
import { MasSecciones, NavegacionApp } from '../navegacion/navegacion-app';
import {
  barraDeRuta,
  esListaAngosta,
  SECCIONES,
  seccionDeRuta,
  volverDeRuta,
} from '../navegacion/secciones';
import { ContextoAcciones, type AccionesPublicadas } from './publicar-acciones';
import { ProveedorEncabezado, useEncabezado } from './proveedor-encabezado';

// El menú se descarga con la primera pantalla hija que publica acciones (05 §13.3): no entra al JS compartido de todas las rutas.
const MasAcciones = lazy(() => import('./mas-acciones').then((m) => ({ default: m.MasAcciones })));

export function Marco({
  children,
  superpuesto,
}: {
  readonly children: ReactNode;
  readonly superpuesto?: ReactNode;
}) {
  const [acciones, setAcciones] = useState<AccionesPublicadas | null>(null);
  return (
    <ProveedorEncabezado>
      <ContextoAcciones value={setAcciones}>
        <CuerpoDelMarco superpuesto={superpuesto} acciones={acciones}>
          {children}
        </CuerpoDelMarco>
      </ContextoAcciones>
    </ProveedorEncabezado>
  );
}

function CuerpoDelMarco({
  children,
  superpuesto,
  acciones,
}: {
  readonly children: ReactNode;
  readonly superpuesto: ReactNode;
  readonly acciones: AccionesPublicadas | null;
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
  // GLO-01 y GLO-02 (06-identidad-visual §11): de dónde entra la pantalla. El marco solo anota la dirección en `#contenido`; el
  // movimiento es CSS (`globals.css`), así que ninguna ruta suma JS.
  const previa = useRef<string | null>(null);
  useLayoutEffect(() => {
    const direccion = direccionDeEntrada(previa.current, pathname);
    previa.current = pathname;
    const contenido = document.getElementById('contenido');
    if (direccion === null) contenido?.removeAttribute('data-entrada');
    else contenido?.setAttribute('data-entrada', direccion);
  }, [pathname]);
  // E3-7: mientras dura un arrastre en el teléfono la barra inferior queda `inert` (el arrastre lo hace la Bandeja, TA-576).
  useEffect(() => {
    const alArrastrar = (e: Event): void => {
      const arrastrando = (e as CustomEvent<boolean>).detail;
      for (const barra of document.querySelectorAll('nav[data-marco-barra]')) {
        if (arrastrando) barra.setAttribute('inert', '');
        else barra.removeAttribute('inert');
      }
    };
    window.addEventListener(EVENTO_ARRASTRE, alArrastrar);
    return () => {
      window.removeEventListener(EVENTO_ARRASTRE, alArrastrar);
    };
  }, []);
  // [E6-20, CH-241] El título de la barra del teléfono que no entra junto a Registrar, la campana y ☰ se achica (`data-ajustado`).
  useEffect(() => {
    const ajustar = (): void => {
      const h1 = document.querySelector<HTMLElement>('#contenido h1.text-titulo-pantalla');
      if (h1 === null) return;
      h1.removeAttribute('data-ajustado');
      if (h1.scrollWidth > h1.clientWidth) h1.setAttribute('data-ajustado', '');
    };
    ajustar();
    // Al cargar las fuentes cambia el ancho del texto: se vuelve a medir (si no, el título medido con la fuente de respaldo queda mal).
    let activo = true;
    void document.fonts.ready.then(() => {
      if (activo) ajustar();
    });
    // El título puede montarse después (la pantalla hija llega por streaming): se mide también cuando cambia el contenido.
    const observador = new MutationObserver(ajustar);
    const contenido = document.getElementById('contenido');
    if (contenido !== null) observador.observe(contenido, { childList: true, subtree: true });
    window.addEventListener('resize', ajustar);
    return () => {
      activo = false;
      observador.disconnect();
      window.removeEventListener('resize', ajustar);
    };
  }, [pathname]);
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
  const tipoBarra = barraDeRuta(pathname, busqueda);
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
        // E6-3 (entrega 4): forma aprobada, `--marca` de 48 px de alto y radio 16, con la nube tachada.
        <div
          role="status"
          data-sin-conexion
          className="text-etiqueta fixed inset-x-4 top-16 z-40 flex min-h-12 items-center gap-2 rounded-contenedor bg-marca px-3.5 py-2.5 text-texto-sobre-marca md:top-2 md:right-6 md:left-68"
        >
          <Icono nombre="wifioff" tamano={18} />
          <span>{bloqueada ? navegacion.sinConexionNavegacion : navegacion.sinConexion}</span>
        </div>
      )}
      {pendientes.size > 0 ? (
        // E6-2: franja de 3 px (`--accion` sobre `--accion-tonal`) debajo del margen seguro; con movimiento reducido
        // queda fija al 38 % (la regla de movimiento de `globals.css` anula la animación).
        <div
          role="progressbar"
          aria-label={navegacion.navegando}
          data-franja-navegacion
          className="fixed inset-x-0 z-50 h-0.75 overflow-hidden bg-accion-tonal"
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="finn-franja h-full w-[38%] bg-accion" />
        </div>
      ) : null}
      <NavegacionApp {...comun} registrar={<AccesoRegistrar ruta={ruta} variante="lateral" />} />
      <div
        id="contenido"
        tabIndex={-1}
        data-barra={tipoBarra}
        data-lista={esListaAngosta(pathname) ? '' : undefined}
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
          {tipoBarra === 'principal' ? (
            <span className="flex w-27.5 justify-end md:hidden">
              <AccesoRegistrar ruta={ruta} variante="barra" />
            </span>
          ) : null}
          {conAcciones ? (
            <Suspense fallback={null}>
              <MasAcciones {...acciones} />
            </Suspense>
          ) : null}
          <Campana valor={contadores.notificaciones} />
          {tipoBarra === 'principal' ? (
            <span className="md:hidden">
              <MasSecciones {...comun} />
            </span>
          ) : null}
        </header>
        {children}
      </div>
      {superpuesto}
    </ContextoNavegacionPendiente>
  );
}

/**
 * La campana (06-identidad-visual 3.1, N7; CF-23): enlaza a `/notificaciones`. Desde otra pantalla la ruta se intercepta y se ve
 * como el panel que cae desde arriba (`@superpuesto/(.)notificaciones`); abierta directamente, es la página completa.
 */
function Campana({ valor }: { readonly valor: number | null }) {
  return (
    <EnlaceFinn
      href="/notificaciones"
      aria-label={navegacion.notificaciones(valor)}
      className="relative inline-flex size-11 items-center justify-center rounded-pastilla text-texto md:bg-superficie-hundida"
    >
      <Icono nombre="bell" tamano={22} />
      <Contador valor={valor} forma="campana" />
    </EnlaceFinn>
  );
}
