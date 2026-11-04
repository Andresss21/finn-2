'use client';
// El resultado de `/registrar/gasto` (06-identidad-visual 2.13, S5 «guardado» del export; 05 §10.7, CA-21.12): «Guardado: …», el
// monto de cada línea, un enlace a cada categoría tocada, «Registrar otro» (tonal) y «Volver a Inicio». Si la persona escribió un
// deudor que ya existía, también dice que la parte quedó a su nombre (CA-21.4). Se carga al guardar (05 §13.1: bytes de la ruta).
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { registrarGasto as t } from '../../textos/registrar-gasto';

interface Referencia {
  readonly id: string;
  readonly nombre: string;
}

export interface LineaGuardada {
  readonly clave: string;
  readonly destino: string;
  /** El monto tal como se guardó, ya formateado. */
  readonly monto: string;
}

// Fuera del JSX por L15.
const TARJETA = 'rounded-contenedor bg-superficie shadow-elevacion-1';
const LISTA_LINEAS =
  'grid grid-cols-3 gap-x-2.5 gap-y-3.5 rounded-contenedor bg-superficie p-3.5 shadow-elevacion-1';
/** Un enlace con el aspecto de un botón principal (05 §10.7), como en el estado sin cuentas. */
const ENLACE_PRINCIPAL =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE_CATEGORIA =
  'inline-flex min-h-11 items-center font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export default function ResultadoGasto({
  texto,
  lineas,
  tocadas,
  reutilizados,
}: {
  readonly texto: string;
  readonly lineas: readonly LineaGuardada[];
  readonly tocadas: readonly Referencia[];
  readonly reutilizados: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className={TARJETA}>
        <Resultado texto={texto} />
      </div>
      <ul className={LISTA_LINEAS} aria-label={t.lineasGuardadas}>
        {lineas.map((l) => (
          <li key={l.clave} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-rotulo truncate text-texto-secundario">{l.destino}</span>
            <span className="font-semibold tabular-nums">{l.monto}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col" aria-label={t.categoriasTocadas}>
        {tocadas.map((x) => (
          <li key={x.id}>
            <EnlaceFinn href={`/presupuesto/categorias/${x.id}`} className={ENLACE_CATEGORIA}>
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
      <div className="grid grid-cols-2 gap-2">
        <Boton
          variante="secundaria"
          className="w-full"
          onClick={() => {
            window.location.assign(window.location.pathname);
          }}
        >
          {t.registrarOtro}
        </Boton>
        <EnlaceFinn href="/" className={ENLACE_PRINCIPAL}>
          {t.volverAInicio}
        </EnlaceFinn>
      </div>
    </div>
  );
}
