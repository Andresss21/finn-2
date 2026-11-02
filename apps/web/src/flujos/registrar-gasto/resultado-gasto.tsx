'use client';
// El resultado de `/registrar/gasto` (05 §10.7, CA-21.12): «Guardado: …» con un enlace a cada categoría tocada y, si la persona escribió
// un deudor que ya existía, que la parte quedó a su nombre (CA-21.4). Se carga al guardar (05 §13.1: presupuesto de bytes de la ruta).
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { registrarGasto as t } from '../../textos/registrar-gasto';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export default function ResultadoGasto({
  texto,
  tocadas,
  reutilizados,
}: {
  readonly texto: string;
  readonly tocadas: readonly Referencia[];
  readonly reutilizados: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Resultado texto={texto} />
      <ul className="flex flex-col gap-1" aria-label={t.categoriasTocadas}>
        {tocadas.map((x) => (
          <li key={x.id}>
            <EnlaceFinn
              href={`/presupuesto/categorias/${x.id}`}
              className="inline-flex min-h-11 items-center font-bold text-enlace underline"
            >
              {t.verCategoria(x.nombre)}
            </EnlaceFinn>
          </li>
        ))}
      </ul>
      {reutilizados.map((nombre) => (
        <p key={nombre} className="text-cuerpo-pequeno text-texto" data-testid="deudor-existente">
          {t.deudorExistente(nombre)}
        </p>
      ))}
      <Boton
        onClick={() => {
          window.location.assign(window.location.pathname);
        }}
      >
        {t.registrarOtro}
      </Boton>
    </div>
  );
}
