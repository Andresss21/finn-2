'use client';
// Selector Gráfico / Tabla de esta pantalla (05 §10.8 `SelectorVista`): estado local, sin cambiar la URL. Son dos botones nativos
// y no el grupo de opciones de Radix de `VistaGrafico`: ese grupo sumaba 1.2 KB al JS compartido de las rutas de formularios
// y rompía su presupuesto (05 §13.1, FE-49). La vista oculta sigue dentro del árbol de accesibilidad (`sr-only`, 11.3), así que
// la tabla equivalente siempre está disponible para un lector de pantalla.
import { useState, type ReactNode } from 'react';
import { cuentas } from '../../../../../textos/cuentas';

const t = cuentas.grafico;
const BOTON =
  'inline-flex min-h-11 items-center rounded-pastilla px-4 text-cuerpo-pequeno focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const OPCIONES = [
  { valor: 'grafico', etiqueta: t.grafico },
  { valor: 'tabla', etiqueta: t.tabla },
] as const;

export function VistaGrafico({
  grafico,
  tabla,
}: {
  readonly grafico: ReactNode;
  readonly tabla: ReactNode;
}) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico');
  return (
    <div data-vista-grafico={vista} className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={t.vista}
        className="inline-flex self-start rounded-pastilla bg-superficie-hundida p-1"
      >
        {OPCIONES.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={vista === o.valor}
            onClick={() => {
              setVista(o.valor);
            }}
            className={[
              BOTON,
              vista === o.valor ? 'bg-accion font-bold text-texto-sobre-accion' : 'text-texto',
            ].join(' ')}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
      <div className={vista === 'grafico' ? '' : 'sr-only'}>{grafico}</div>
      <div className={vista === 'tabla' ? '' : 'sr-only'}>{tabla}</div>
    </div>
  );
}
