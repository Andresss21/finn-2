'use client';
// La sugerencia de categoría de `/registrar/gasto` (CP-3, 01 §4.17): mientras se escribe el comercio, la categoría de su regla o,
// sin regla, la de la última compra aprobada ahí. Se carga recién cuando hay un comercio escrito (05 §13.1: el presupuesto de bytes de
// la ruta). Es solo una ayuda y sus errores no son del formulario. [CH-277] Llena la categoría de «Una» si está vacía, sin tocar
// una elegida (C-49 §1), y dice «Suele ir a {categoría}» debajo del comercio.
import { useEffect } from 'react';
import { useLecturaInteractiva } from '../../formularios/use-lectura-interactiva';
import { sugerencia } from '../../servidor/lecturas/interactivas';
import { base } from '../../textos/base';

export interface CategoriaSugerida {
  readonly id: string;
  readonly nombre: string;
}

const leer = async ({ texto }: { readonly texto: string }) => {
  const r = await sugerencia({ comercio: texto });
  return r.ok ? { ...r, valor: r.valor.sugerencia } : r;
};

export default function SugerenciaComercio({
  comercio,
  alUsar,
}: {
  readonly comercio: string;
  readonly alUsar: (categoria: CategoriaSugerida) => void;
}) {
  const { resultado, consultar } = useLecturaInteractiva(leer);
  useEffect(() => {
    consultar(comercio);
  }, [comercio, consultar]);
  const categoria = resultado?.categoria;
  useEffect(() => {
    if (categoria !== undefined) alUsar(categoria);
  }, [categoria, alUsar]);
  if (categoria === undefined) return null;
  return (
    <p className="campo-ayuda" data-testid="sugerencia">
      {base.sueleIrA(categoria.nombre)}
    </p>
  );
}
