'use client';
// FT-78 (CA-78.11): «Otra categoría…» termina el arrastre sin aprobar y abre este selector para el movimiento; elegir una
// categoría ejecuta la misma variante de OP-37 que soltar sobre ella, sin volver a arrastrar. Es una selección nativa
// agrupada, con las categorías de `destinosArrastre.grupos` (CF-22).
import { SeleccionNativa, type OpcionNativa } from '../../../componentes/base/seleccion-nativa';
import { Superpuesto } from '../../../componentes/marco/superpuesto';
import { bandeja } from '../../../textos/bandeja';
import type { DestinosArrastre } from './arrastre';

const t = bandeja.arrastre.selector;

export function OtraCategoria({
  grupos,
  alElegir,
  alCerrar,
}: {
  readonly grupos: DestinosArrastre['grupos'];
  readonly alElegir: (categoriaId: string) => void;
  readonly alCerrar: () => void;
}) {
  const opciones: OpcionNativa[] = grupos.flatMap((g) =>
    g.categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre, grupo: g.grupo.nombre })),
  );
  return (
    <Superpuesto titulo={t.titulo} alCerrar={alCerrar}>
      <SeleccionNativa
        etiqueta={t.etiqueta}
        marcador={t.marcador}
        opciones={opciones}
        valor=""
        alCambiar={alElegir}
      />
    </Superpuesto>
  );
}
