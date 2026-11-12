// `/cuentas` (FT-51; 06-identidad-visual §9): posición neta, tarjetas en billetera, efectivo, préstamos, inversiones y, a pedido,
// las archivadas. Dibuja lo que trae el DTO: no calcula montos (PF-3). La cara de cada tarjeta sale de su color guardado
// (CH-225), decorativa.
import type { CuentasDto } from '@finn/aplicacion/consultas/cuentas';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { InterruptorEnlace } from '../../../componentes/base/interruptor-enlace';
import { Vacio } from '../../../componentes/base/vacio';
import { BilleteraTarjetas, type TarjetaDto } from '../../../componentes/dominio/billetera';
import { IdentidadCuenta } from '../../../componentes/dominio/identidad-cuenta';
import { Monto } from '../../../componentes/dominio/monto';
import { PosicionNeta } from '../../../componentes/dominio/posicion-neta';
import { PublicarAcciones } from '../../../componentes/marco/publicar-acciones';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../componentes/navegacion/enlace-finn';
import { cuentas as t } from '../../../textos/cuentas';

const p = t.pantalla;
/** E4-33/E6-11: «Nueva cuenta» y «Ordenar las cuentas» viven en el menú «En Cuentas»; sin cuentas, solo la primera. */
const ACCION_NUEVA = { etiqueta: p.nuevaCuenta, ruta: '/cuentas/nueva', icono: 'plus' } as const;
const ACCIONES_CON_CUENTAS = [
  ACCION_NUEVA,
  { etiqueta: p.ordenarCuentas, ruta: '/cuentas/ordenar', icono: 'grip' },
] as const;
const ACCIONES_SIN_CUENTAS = [ACCION_NUEVA] as const;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const TARJETA = `block rounded-identidad ${FOCO}`;

function Grupo({
  titulo,
  total,
  cantidad,
  clase = '',
  children,
}: {
  readonly titulo: string;
  readonly total?: Centavos;
  readonly cantidad?: number;
  readonly clase?: string;
  readonly children: ReactNode;
}) {
  return (
    <section data-grupo={titulo} className={['flex flex-col gap-3', clase].join(' ')}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-titulo-seccion" style={{ fontSize: '1.125rem' }}>
          {titulo}
        </h2>
        <span className="text-cuerpo-pequeno font-semibold text-texto-secundario">
          {total === undefined ? cantidad : <Monto centavos={total} rol="cuerpo" />}
        </span>
      </div>
      {children}
    </section>
  );
}

export function PantallaCuentas({ dto }: { readonly dto: CuentasDto }) {
  const { posicionNeta, archivadas } = dto;
  const sinCuentas =
    dto.efectivo.length + dto.tarjetas.length + dto.prestamos.length + dto.inversiones.length ===
      0 && (archivadas ?? []).length === 0;
  const tarjetas: readonly TarjetaDto[] = dto.tarjetas;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <PublicarAcciones
        titulo={p.enCuentas}
        acciones={sinCuentas ? ACCIONES_SIN_CUENTAS : ACCIONES_CON_CUENTAS}
      />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{p.titulo}</h1>
      </div>
      {sinCuentas ? (
        <Vacio
          titulo={p.vacioTitulo}
          texto={p.vacioTexto}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={BOTON}>
              {p.vacioAccion}
            </EnlaceFinn>
          }
        />
      ) : (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-x-10">
          <div className="flex flex-col gap-3 md:col-start-1">
            <PosicionNeta posicion={posicionNeta} enCamino={dto.enCamino} />
          </div>
          {tarjetas.length === 0 ? null : (
            <Grupo
              titulo={p.grupos.tarjetas}
              total={posicionNeta.deudas.tarjetas}
              clase="md:col-start-2 md:row-span-4 md:row-start-1 md:self-start"
            >
              <BilleteraTarjetas tarjetas={tarjetas} enlazar />
            </Grupo>
          )}
          {dto.efectivo.length === 0 ? null : (
            <Grupo
              titulo={p.grupos.efectivo}
              total={posicionNeta.activos.efectivo}
              clase="md:col-start-1"
            >
              <div className="grid grid-cols-2 gap-2.5">
                {dto.efectivo.map((x) => (
                  <EnlaceFinn
                    key={x.cuenta.id}
                    href={`/cuentas/${x.cuenta.id}`}
                    className={TARJETA}
                  >
                    <IdentidadCuenta tipo="efectivo" fila={x} />
                  </EnlaceFinn>
                ))}
              </div>
            </Grupo>
          )}
          {dto.prestamos.length === 0 ? null : (
            <Grupo
              titulo={p.grupos.prestamos}
              total={posicionNeta.deudas.prestamos}
              clase="md:col-start-1"
            >
              {dto.prestamos.map((x) => (
                <EnlaceFinn key={x.cuenta.id} href={`/cuentas/${x.cuenta.id}`} className={TARJETA}>
                  <IdentidadCuenta tipo="prestamo" fila={x} />
                </EnlaceFinn>
              ))}
            </Grupo>
          )}
          {dto.inversiones.length === 0 ? null : (
            <Grupo
              titulo={p.grupos.inversiones}
              total={posicionNeta.activos.inversiones}
              clase="md:col-start-1"
            >
              {dto.inversiones.map((x) => (
                <EnlaceFinn key={x.cuenta.id} href={`/cuentas/${x.cuenta.id}`} className={TARJETA}>
                  <IdentidadCuenta tipo="inversion" fila={x} />
                </EnlaceFinn>
              ))}
            </Grupo>
          )}
          <div className="flex flex-col gap-3 md:col-start-2">
            {/* Cada estado del interruptor tiene su URL y funciona sin hidratar. */}
            {archivadas === undefined || archivadas.length === 0 ? (
              <InterruptorEnlace
                href={archivadas === undefined ? '/cuentas?archivadas=1' : '/cuentas'}
                activo={archivadas !== undefined}
                etiqueta={p.mostrarArchivadas}
              />
            ) : (
              <Grupo titulo={p.grupos.archivadas} cantidad={archivadas.length}>
                <InterruptorEnlace href="/cuentas" activo etiqueta={p.mostrarArchivadas} />
                {archivadas.map((x) => (
                  <EnlaceFinn key={x.id} href={`/cuentas/${x.id}`} className={TARJETA}>
                    <IdentidadCuenta tipo="archivada" fila={x} />
                  </EnlaceFinn>
                ))}
              </Grupo>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
