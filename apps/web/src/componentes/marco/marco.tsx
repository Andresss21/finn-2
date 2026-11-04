'use client';
// `Marco` (05 §1.2, §1.6, FE-06; 06-identidad-visual §3; portado del export K1 y de la entrega 2 del diseño, CH-109): lo que
// rodea a toda pantalla de `(finn)`. Contiene el `ProveedorEncabezado`, la barra superior, la navegación entre secciones
// (barra inferior y lateral), el enlace «Saltar al contenido» y el indicador global de navegación en curso (FE-39). No mueve
// el foco al navegar (11.2).
// Teléfono: el título es el `h1` de la página, que `globals.css` pone en la barra; una hija (`volverDeRuta`) lleva «Volver
// a…» y la campana, las demás Registrar, campana y ☰; `PaginaFlujo` oculta las barras. Computadora: campana arriba a la derecha.
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
import { precargar, SuperpuestoDiferido } from '../navegacion/hoja-diferida';
import { useRefrescar } from '../navegacion/use-refrescar';
import { MasSecciones, NavegacionApp } from '../navegacion/navegacion-app';
import { SECCIONES, seccionDeRuta, volverDeRuta } from '../navegacion/secciones';
import { ProveedorEncabezado, useEncabezado } from './proveedor-encabezado';

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
      <NavegacionApp {...comun} registrar={<AccesoRegistrar ruta={ruta} variante="lateral" />} />
      <div
        id="contenido"
        tabIndex={-1}
        data-barra={volver === null ? 'principal' : 'hija'}
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
          <Campana valor={contadores.notificaciones} />
          {volver === null ? (
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
