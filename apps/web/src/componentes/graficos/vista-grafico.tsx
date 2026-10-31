'use client';
// Selector Gráfico / Tabla (05 §10.8.1 `SelectorVista`): estado local, no cambia la URL. Recibe el gráfico y la tabla
// ya dibujados en el servidor (no importa d3). La vista oculta queda a la vista de nadie pero dentro del árbol de
// accesibilidad (`sr-only`, 11.3), así que la tabla equivalente siempre está disponible para un lector de pantalla.
import { useState, type ReactNode } from 'react';
import { cuentas } from '../../textos/cuentas';
import { SelectorSegmentado } from '../base/selector-segmentado';

const t = cuentas.grafico;
const OCULTO = 'sr-only';

export function VistaGrafico({
  grafico,
  tabla,
  vistaInicial = 'grafico',
}: {
  readonly grafico: ReactNode;
  readonly tabla: ReactNode;
  readonly vistaInicial?: 'grafico' | 'tabla';
}) {
  const [vista, setVista] = useState<string>(vistaInicial);
  return (
    <div data-vista-grafico={vista} className="flex flex-col gap-3">
      <SelectorSegmentado
        etiqueta={t.vista}
        opciones={[
          { valor: 'grafico', etiqueta: t.grafico },
          { valor: 'tabla', etiqueta: t.tabla },
        ]}
        valor={vista}
        alCambiar={setVista}
      />
      <div className={vista === 'grafico' ? '' : OCULTO}>{grafico}</div>
      <div className={vista === 'tabla' ? '' : OCULTO}>{tabla}</div>
    </div>
  );
}
