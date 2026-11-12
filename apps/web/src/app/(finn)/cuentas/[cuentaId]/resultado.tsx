// E2-13 (CH-240): el resultado de verificar saldo y de pagar la tarjeta queda en el detalle, bajo las acciones, sin pantalla propia ni
// tiempo límite. Lo dibuja a partir de `?resultado=` (validado en `flujos/cuentas-resultado.ts`); el detalle de arriba ya trae los
// datos actualizados (saldos, movimientos, conciliaciones), así que acá no se calcula ni se repite ningún monto del motor (PF-3).
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Resultado } from '../../../../componentes/base/resultado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { formatearFecha, formatearMontoTexto } from '../../../../formato';
import type { ResultadoDeFlujo } from '../../../../flujos/cuentas-resultado';
import { cuentasPagar } from '../../../../textos/cuentas-pagar';
import { verificarSaldo } from '../../../../textos/verificar-saldo';

const ENLACE =
  'inline-flex min-h-11 items-center font-semibold text-enlace focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function ResultadoDelFlujo({
  resultado,
  nombre,
  categoriaPagoId,
}: {
  readonly resultado: ResultadoDeFlujo | undefined;
  readonly nombre: string;
  /** La categoría de pago de una tarjeta, para «Ver la categoría de pago». */
  readonly categoriaPagoId?: string;
}) {
  if (resultado === undefined) return null;
  if (resultado.tipo === 'verificado')
    return (
      <div data-resultado-flujo="verificado">
        <Resultado
          texto={verificarSaldo.verificado(formatearFecha(resultado.fecha), resultado.marcadas)}
        />
      </div>
    );
  return (
    <div data-resultado-flujo="pagado" className="flex flex-col gap-2">
      <Resultado texto={cuentasPagar.guardado(formatearMontoTexto(resultado.monto), nombre)} />
      {resultado.excedente ? (
        <AvisoEnLinea estado="informacion">{cuentasPagar.avisoExcedente(nombre)}</AvisoEnLinea>
      ) : null}
      {categoriaPagoId === undefined ? null : (
        <EnlaceFinn href={`/presupuesto/categorias/${categoriaPagoId}`} className={ENLACE}>
          {cuentasPagar.verCategoria(nombre)}
        </EnlaceFinn>
      )}
    </div>
  );
}
