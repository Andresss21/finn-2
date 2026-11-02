// `/cuentas/[cuentaId]` (FT-52; 06-identidad-visual §9): cabecera con saldo y saldo confirmado, el selector de período y los
// movimientos con saldo corrido. Dibuja lo que trae el DTO: no calcula montos (PF-3) ni períodos (05 §3.4). Las acciones, las
// conciliaciones y el bloque de cada tipo de cuenta son de las partes siguientes de la ficha.
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Monto } from '../../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../../componentes/navegacion/selector-periodo';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { Movimientos, type FiltrosDetalle } from './movimientos';

const ENLACE =
  'inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function PantallaDetalleCuenta({
  dto,
  filtros,
}: {
  readonly dto: DetalleCuentaDto;
  readonly filtros: FiltrosDetalle;
}) {
  const { cuenta, navegacion } = dto;
  const parametros = Object.fromEntries(
    Object.entries({ tipo: filtros.tipo, estado: filtros.estado }).filter(
      (e): e is [string, string] => e[1] !== undefined,
    ),
  );
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <EnlaceFinn href="/cuentas" className={ENLACE}>
        {t.volver}
      </EnlaceFinn>
      <header className="flex flex-col gap-2">
        <h1 className="text-titulo-pantalla">{cuenta.nombre}</h1>
        <p className="flex flex-wrap items-center gap-2 text-cuerpo-pequeno text-texto-secundario">
          {cuenta.institucion === undefined ? null : <span>{cuenta.institucion}</span>}
          {cuenta.ultimos4 === undefined ? null : <span>{`•••• ${cuenta.ultimos4}`}</span>}
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="text-rotulo text-texto-secundario">{t.saldo}</dt>
            <dd>
              <Monto centavos={dto.saldo} rol="cifra-principal" />
            </dd>
          </div>
          <div>
            <dt className="text-rotulo text-texto-secundario">{t.saldoConfirmado}</dt>
            <dd>
              <Monto centavos={dto.saldoConfirmado} rol="cifra" />
            </dd>
          </div>
        </dl>
      </header>
      <SelectorPeriodo
        periodo={dto.periodo}
        periodoActivo={dto.periodoActivo}
        {...(navegacion.anterior === undefined ? {} : { anterior: navegacion.anterior })}
        {...(navegacion.siguiente === undefined ? {} : { siguiente: navegacion.siguiente })}
        ruta={`/cuentas/${cuenta.id}`}
        parametros={parametros}
      />
      <Movimientos dto={dto} filtros={filtros} />
    </main>
  );
}
