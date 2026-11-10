'use client';
// «Más acciones» de una pantalla hija (P1-04, CH-115): el menú de acciones de K2. Se carga diferido desde `marco.tsx`.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { navegacion } from '../../textos/navegacion';
import { useSalida } from '../movimiento/use-salida';
import { Icono } from '../base/icono';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import type { AccionesPublicadas } from './publicar-acciones';

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
export function MasAcciones({ titulo, acciones }: AccionesPublicadas) {
  const [abierto, setAbierto] = useState(false);
  // [CH-220 C1] El menú sale (opacidad 0, escala .96) y recién después se desmonta.
  const { saliendo, salir, alTerminarAnimacion, reiniciar } = useSalida(() => {
    setAbierto(false);
  }, '--duracion-rapida');
  const salirRef = useRef(salir);
  useEffect(() => {
    salirRef.current = salir;
  });
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
      if (dentro !== true) salirRef.current();
    };
    document.addEventListener('pointerdown', alTocar);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
    };
  }, [abierto]);
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    const lista = items();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      salir();
      boton.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const paso = e.key === 'ArrowDown' ? 1 : lista.length - 1;
      lista[(i + paso) % lista.length]?.focus();
    } else if (e.key === 'Tab') salir();
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
          if (abierto) salir();
          else {
            reiniciar();
            setAbierto(true);
          }
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
          {...(saliendo ? { 'data-saliendo': '' } : {})}
          onAnimationEnd={saliendo ? alTerminarAnimacion : undefined}
          className="fz-menu absolute top-12 right-0 z-40 w-75 max-w-[calc(100vw-2rem)] overflow-hidden rounded-contenedor bg-superficie py-1 shadow-elevacion-2"
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
