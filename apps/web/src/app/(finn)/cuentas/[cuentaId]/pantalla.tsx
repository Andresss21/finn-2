// `/cuentas/[cuentaId]` (FT-52; 06-identidad-visual §9; export `06-detalle-de-cuenta`): la cabecera de la cuenta, sus acciones, el
// bloque de su tipo, los movimientos con saldo corrido, las conciliaciones y las programadas. En teléfono van en una columna; en
// computadora, la cuenta a la izquierda y su historial a la derecha. Dibuja lo que trae el DTO: no calcula montos (PF-3) ni
// períodos (05 §3.4).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { PublicarAcciones } from '../../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { VolverEnTitulo } from '../../../../componentes/navegacion/volver-en-titulo';
import { SelectorPeriodo } from '../../../../componentes/navegacion/selector-periodo';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { AccionesArchivada, AccionesPrincipales, Programadas, menuDe } from './acciones';
import { Cabecera } from './cabecera';
import { AvisoDiferencia, Conciliaciones } from './conciliaciones';
import { Movimientos, type FiltrosDetalle } from './movimientos';
import { BloquePrestamo, BloqueTarjeta, ProximaCuota } from './por-tipo';

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
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones titulo={cuenta.nombre} acciones={menuDe(dto)} />
      {/* A5: la flecha va en la fila del título; en teléfono, en la barra (CH-109) */}
      <div className="-ml-2 flex items-center gap-1">
        <VolverEnTitulo href="/cuentas" etiqueta={t.volver} />
        <h1 className="min-w-0 flex-1 text-titulo-pantalla">{cuenta.nombre}</h1>
      </div>
      <div className="flex flex-col gap-6 @[996px]:grid @[996px]:grid-cols-[1fr_1.6fr] @[996px]:items-start @[996px]:gap-x-9">
        <div className="flex flex-col gap-6">
          <Cabecera dto={dto} />
          {cuenta.archivada ? (
            <AvisoEnLinea estado="informacion">{t.soloLectura}</AvisoEnLinea>
          ) : (
            <AvisoDiferencia conciliacion={dto.conciliaciones[0]} />
          )}
          <AccionesPrincipales cuenta={cuenta} />
          <AccionesArchivada cuenta={cuenta} desarchivar={desarchivar} archivar={archivar} />
          {dto.tarjeta === undefined ? null : <BloqueTarjeta tarjeta={dto.tarjeta} />}
        </div>
        <div className="flex flex-col gap-6">
          {dto.prestamo === undefined || cuenta.archivada ? null : (
            <ProximaCuota cuentaId={cuenta.id} prestamo={dto.prestamo} />
          )}
          {dto.prestamo === undefined ? null : (
            <BloquePrestamo prestamo={dto.prestamo} cuentaId={cuenta.id} />
          )}
          <Movimientos
            dto={dto}
            filtros={filtros}
            selector={
              <SelectorPeriodo
                periodo={dto.periodo}
                periodoActivo={dto.periodoActivo}
                {...(navegacion.anterior === undefined ? {} : { anterior: navegacion.anterior })}
                {...(navegacion.siguiente === undefined ? {} : { siguiente: navegacion.siguiente })}
                ruta={`/cuentas/${cuenta.id}`}
                parametros={parametros}
              />
            }
          />
          <Conciliaciones conciliaciones={dto.conciliaciones} />
          <Programadas programadas={dto.programadas} />
        </div>
      </div>
    </main>
  );
}
