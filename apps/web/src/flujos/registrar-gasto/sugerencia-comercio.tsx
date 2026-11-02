'use client';
// La sugerencia de categoría de `/registrar/gasto` (CP-3, 01 §4.17): mientras se escribe el comercio, la categoría de su regla o,
// sin regla, la de la última compra aprobada ahí. Se carga recién cuando hay un comercio escrito (05 §13.1: el presupuesto de bytes de
// la ruta). Es solo una ayuda: usarla es un toque, y sus errores no son del formulario.
import { useEffect } from 'react';
import { Boton } from '../../componentes/base/boton';
import { useLecturaInteractiva } from '../../formularios/use-lectura-interactiva';
import { sugerencia } from '../../servidor/lecturas/interactivas';
import { registrarGasto as t } from '../../textos/registrar-gasto';

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
  if (resultado === null) return null;
  const { categoria } = resultado;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="sugerencia">
      <p className="text-cuerpo-pequeno text-texto">{t.sugerencia(categoria.nombre)}</p>
      <Boton
        variante="secundaria"
        onClick={() => {
          alUsar(categoria);
        }}
      >
        {t.usarSugerencia}
      </Boton>
    </div>
  );
}
