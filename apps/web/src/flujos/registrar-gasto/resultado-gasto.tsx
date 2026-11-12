'use client';
// El resultado de `/registrar/gasto` (06-identidad-visual 2.13, S5 «guardado» del export; 05 §10.7, CA-21.12): «Guardado: …», el
// monto de cada línea, un enlace a cada categoría tocada, «Registrar otro» (tonal) y «Volver a Inicio». Si la persona escribió un
// deudor que ya existía, también dice que la parte quedó a su nombre (CA-21.4). Se carga al guardar (05 §13.1: bytes de la ruta).
import { Boton } from '../../componentes/base/boton';
import { Resultado } from '../../componentes/base/resultado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { registrarGasto as t } from '../../textos/registrar-gasto';

/** Una parte del gasto: dónde quedó, el enlace que lleva ahí y el monto tal como se guardó, ya formateado. */
export interface ParteGuardada {
  readonly clave: string;
  /** La categoría o «{persona} te debe». */
  readonly nombre: string;
  readonly href: string;
  readonly verTexto: string;
  readonly monto: string;
}

// Fuera del JSX por L15.
const TARJETA = 'rounded-contenedor bg-superficie shadow-elevacion-1';
const LISTA_PARTES =
  'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie px-3.5 py-2 shadow-elevacion-1';
/** Un enlace con el aspecto de un botón principal (05 §10.7), como en el estado sin cuentas. */
const ENLACE_PRINCIPAL =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE_CATEGORIA =
  'inline-flex min-h-11 items-center font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export default function ResultadoGasto({
  texto,
  transaccionId,
  partes,
  reutilizados,
}: {
  readonly texto: string;
  /** La transacción creada (OP-20 devuelve su id): «Ver transacción». */
  readonly transaccionId: string;
  readonly partes: readonly ParteGuardada[];
  readonly reutilizados: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className={TARJETA}>
        <Resultado
          texto={texto}
          enlace={<EnlaceFinn href={`/actividad/${transaccionId}`}>{t.verTransaccion}</EnlaceFinn>}
        />
      </div>
      {/* [CH-240 E4-2] «Repartido en»: un enlace por cada categoría y cada deudor tocados, con su monto */}
      <section aria-labelledby="repartido-en" className="flex flex-col gap-2">
        <h2 id="repartido-en" className="text-rotulo text-texto-secundario">
          {t.repartidoEn}
        </h2>
        <ul className={LISTA_PARTES} aria-label={t.lineasGuardadas}>
          {partes.map((p) => (
            <li key={p.clave} className="flex items-center gap-3 py-1">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{p.nombre}</span>
                <EnlaceFinn href={p.href} className={ENLACE_CATEGORIA}>
                  {p.verTexto}
                </EnlaceFinn>
              </span>
              <span className="font-semibold tabular-nums">{p.monto}</span>
            </li>
          ))}
        </ul>
      </section>
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
