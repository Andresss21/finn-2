'use client';
// `Marco` (05 §1.2, §1.6, FE-06; 06-identidad-visual §3): lo que rodea a toda pantalla de `(finn)`. Contiene el
// `ProveedorEncabezado`, la barra superior (Registrar, campana y «Más secciones» en teléfono), la navegación, el enlace
// «Saltar al contenido» y el indicador global de navegación en curso (FE-39). No mueve el foco al navegar (11.2).
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { navegacion } from '../../textos/navegacion';
import { Icono } from '../base/icono';
import { AccesoRegistrar } from '../navegacion/acceso-registrar';
import { ContextoNavegacionPendiente, EnlaceFinn } from '../navegacion/enlace-finn';
import { Contador, MasSecciones, NavegacionApp } from '../navegacion/navegacion-app';
import { rutaRegistrar, SECCIONES, seccionDeRuta } from '../navegacion/secciones';
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
  const { encabezado } = useEncabezado();
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

  return (
    <ContextoNavegacionPendiente value={marcar}>
      <a
        href="#contenido"
        className="text-etiqueta sr-only z-50 rounded-control bg-superficie-elevada px-4 py-3 text-texto focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {navegacion.saltar}
      </a>
      {pendientes.size > 0 ? (
        <div
          role="progressbar"
          aria-label={navegacion.navegando}
          className="fixed inset-x-0 top-0 z-50 h-0.75 animate-pulse bg-accion"
        />
      ) : null}
      <header className="fixed inset-x-0 top-0 z-30 flex h-15 items-center justify-between bg-fondo pr-2 pl-5 md:left-62 md:h-16 md:justify-end md:pr-12">
        <span className="text-titulo-seccion md:hidden">{navegacion.marca}</span>
        <div className="flex items-center gap-1">
          <span className="md:hidden">
            <AccesoRegistrar ruta={ruta} variante="barra" />
          </span>
          <EnlaceFinn
            href="/notificaciones"
            aria-label={navegacion.notificaciones(contadores.notificaciones)}
            className="relative inline-flex size-11 items-center justify-center rounded-pastilla text-texto md:bg-superficie-hundida"
          >
            <Icono nombre="bell" tamano={22} />
            <Contador valor={contadores.notificaciones} />
          </EnlaceFinn>
          <span className="md:hidden">
            <MasSecciones {...comun} />
          </span>
        </div>
      </header>
      <NavegacionApp {...comun} registrar={<AccesoRegistrar ruta={ruta} variante="lateral" />} />
      <div
        id="contenido"
        tabIndex={-1}
        className="pt-15 pb-28 outline-none md:pt-16 md:pb-0 md:pl-62"
      >
        {children}
      </div>
      {superpuesto}
    </ContextoNavegacionPendiente>
  );
}
