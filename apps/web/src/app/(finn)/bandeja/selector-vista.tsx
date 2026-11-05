'use client';
// El selector segmentado de la Bandeja (S4 del export, CH-139): «Por revisar · N» y «Descartados». La vista vive en la URL
// (`?vista=descartados`), así que elegir una opción navega; el número de por revisar lo trae el servidor (PF-3).
import { SelectorSegmentado } from '../../../componentes/base/selector-segmentado';
import { useIrA } from '../../../componentes/navegacion/use-ir-a';
import { bandeja as t } from '../../../textos/bandeja';

export function SelectorVista({
  activa,
  porRevisar,
}: {
  readonly activa: 'activos' | 'descartados';
  /** Los movimientos por revisar de `bandeja()`; `null` si el servidor no lo dio: el rótulo no inventa un cero. */
  readonly porRevisar: number | null;
}) {
  const irA = useIrA();
  return (
    <SelectorSegmentado
      llena
      etiqueta={t.vistas.nombre}
      valor={activa}
      opciones={[
        {
          valor: 'activos',
          etiqueta: porRevisar === null ? t.vistas.activos : t.vistas.activosConConteo(porRevisar),
        },
        { valor: 'descartados', etiqueta: t.vistas.descartados },
      ]}
      alCambiar={(valor) => {
        if (valor !== activa)
          irA(valor === 'descartados' ? '/bandeja?vista=descartados' : '/bandeja');
      }}
    />
  );
}
