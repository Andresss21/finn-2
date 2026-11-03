// `/cuentas/[cuentaId]` (FT-52; 06-identidad-visual §9): cabecera con saldo y saldo confirmado, el selector de período y los
// movimientos con saldo corrido. Dibuja lo que trae el DTO: no calcula montos (PF-3) ni períodos (05 §3.4). Más las
// acciones, el bloque del tipo de cuenta (tarjeta, préstamo o inversión), las conciliaciones y las programadas.
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { IndicadorEstado } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../../componentes/navegacion/selector-periodo';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { Acciones, Programadas } from './acciones';
import { Conciliaciones } from './conciliaciones';
import { Movimientos, type FiltrosDetalle } from './movimientos';
import { BloqueInversion, BloquePrestamo, BloqueTarjeta } from './por-tipo';

const ENLACE =
  'inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function PantallaDetalleCuenta({
  dto,
  filtros,
  desarchivar,
  archivar,
}: {
  readonly dto: DetalleCuentaDto;
  readonly filtros: FiltrosDetalle;
  /** La Server Action de OP-05: la pasa el lector. */
  readonly desarchivar: AccionEscritura;
  /** La Server Action de OP-04 («Archivar de nuevo»): la pasa el lector. */
  readonly archivar: AccionEscritura;
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
          {cuenta.archivada ? <IndicadorEstado estado="cero" etiqueta={t.archivada} /> : null}
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
      {cuenta.archivada ? <AvisoEnLinea estado="informacion">{t.soloLectura}</AvisoEnLinea> : null}
      <Acciones cuenta={cuenta} desarchivar={desarchivar} archivar={archivar} />
      {dto.tarjeta === undefined ? null : <BloqueTarjeta tarjeta={dto.tarjeta} />}
      {dto.prestamo === undefined ? null : <BloquePrestamo prestamo={dto.prestamo} />}
      {dto.inversion === undefined ? null : <BloqueInversion inversion={dto.inversion} />}
      <Conciliaciones conciliaciones={dto.conciliaciones} />
      <Programadas programadas={dto.programadas} />
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
