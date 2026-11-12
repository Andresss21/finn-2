'use client';
// `SelectorReportes` (05 §10.7, CH-E5-1; 06 FT-60 paso 4): los 15 reportes en tres grupos. Cada opción es un enlace a
// `/reportes/[tipo]` con `aria-current="page"` en el actual (el contenido depende de la URL: no son pestañas de ARIA).
// Teléfono: un botón ancho bajo el título que abre una hoja (diferida: Radix no entra en el JS de la ruta). Desde 1024 px:
// la misma lista, siempre a la vista, en una columna de 232 px. No hay estado «abierto» en computadora.
import { useState } from 'react';
import { reportes as t } from '../../textos/reportes';
import { Icono } from '../base/icono';
import { EnlaceFinn } from './enlace-finn';
import { SuperpuestoDiferido } from './hoja-diferida';

export interface OpcionDeReporte {
  readonly id: string;
  readonly href: string;
}

export interface PropsSelectorReportes {
  /** El `[tipo]` de la URL del reporte abierto. */
  readonly actual: string;
  /** Cada tipo con su URL (conserva ventana y cuentas, que son de todos los reportes). */
  readonly opciones: readonly OpcionDeReporte[];
}

type TipoNombrado = keyof typeof t.selector.nombres;

// Clase literal (L13): fila de 48 px, el actual con fondo y peso.
const FILA =
  'relative flex min-h-12 items-center justify-between gap-3 rounded-control px-3 text-cuerpo text-texto hover:bg-superficie-hundida focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco aria-[current=page]:bg-superficie-hundida aria-[current=page]:font-bold';

function Lista({
  actual,
  opciones,
  alElegir,
}: PropsSelectorReportes & { readonly alElegir?: () => void }) {
  const href = new Map(opciones.map((o) => [o.id, o.href]));
  return (
    <div className="flex flex-col gap-4">
      {t.selector.grupos.map((g) => (
        <section key={g.id} className="flex flex-col" aria-label={g.rotulo}>
          <h3 aria-hidden="true" className="text-etiqueta px-3 py-1 text-texto-secundario">
            {g.rotulo}
          </h3>
          <ul className="flex flex-col">
            {g.tipos.map((tipo) => (
              <li key={tipo}>
                <EnlaceFinn
                  href={href.get(tipo) ?? `/reportes/${tipo}`}
                  className={FILA}
                  {...(tipo === actual ? { 'aria-current': 'page' as const } : {})}
                  {...(alElegir === undefined ? {} : { onClick: alElegir })}
                >
                  {t.selector.nombres[tipo]}
                  {tipo === actual ? <Icono nombre="check" tamano={20} /> : null}
                  {tipo === actual ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 hidden w-0.75 rounded-pastilla bg-accion md:block"
                    />
                  ) : null}
                </EnlaceFinn>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function SelectorReportes({ actual, opciones }: PropsSelectorReportes) {
  const [abierto, setAbierto] = useState(false);
  const nombre = t.selector.nombres[actual as TipoNombrado];
  const grupo = t.selector.grupos.find((g) => (g.tipos as readonly string[]).includes(actual));
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={t.selector.elegir(grupo?.rotulo ?? '', nombre)}
        onClick={() => {
          setAbierto(true);
        }}
        className="flex min-h-15 w-full items-center justify-between gap-2.5 rounded-control bg-superficie py-1.5 pr-3 pl-3.5 text-left shadow-elevacion-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco md:hidden"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-etiqueta text-texto-secundario">{grupo?.rotulo}</span>{' '}
          <span className="truncate text-cuerpo font-semibold text-texto">{nombre}</span>
        </span>
        <Icono nombre="chevD" tamano={20} />
      </button>
      <nav aria-label={t.selector.etiqueta} data-selector-reportes className="hidden md:block">
        <Lista actual={actual} opciones={opciones} />
      </nav>
      {abierto ? (
        <SuperpuestoDiferido
          titulo={t.selector.tituloHoja}
          alCerrar={() => {
            setAbierto(false);
          }}
        >
          <nav aria-label={t.selector.etiqueta} className="overflow-y-auto px-3 pb-6">
            <Lista
              actual={actual}
              opciones={opciones}
              alElegir={() => {
                setAbierto(false);
              }}
            />
          </nav>
        </SuperpuestoDiferido>
      ) : null}
    </>
  );
}
