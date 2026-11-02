// `/cuentas` (FT-51; 06-identidad-visual §9): posición neta, tarjetas en billetera, efectivo, préstamos, inversiones y, a pedido,
// las archivadas. Dibuja lo que trae el DTO: no calcula montos (PF-3). Las caras de las tarjetas son decorativas y se asignan por
// orden (primera oro, segunda plata, y así; 06 «Precisión»).
import type { CuentasDto } from '@finn/aplicacion/consultas/cuentas';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { Icono } from '../../componentes/base/icono';
import { Vacio } from '../../componentes/base/vacio';
import { BilleteraTarjetas, type TarjetaDto } from '../../componentes/dominio/billetera';
import { IdentidadCuenta } from '../../componentes/dominio/identidad-cuenta';
import { IndicadorEstado } from '../../componentes/dominio/indicador-estado';
import { Monto } from '../../componentes/dominio/monto';
import { PosicionNeta } from '../../componentes/dominio/posicion-neta';
import { PublicarEncabezado } from '../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { cuentas as t } from '../../textos/cuentas';
import { glosario } from '../../textos/glosario';

const p = t.pantalla;
const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const ACCION = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const TARJETA = `block rounded-identidad ${FOCO}`;

function Grupo({
  titulo,
  total,
  clase = '',
  children,
}: {
  readonly titulo: string;
  readonly total?: Centavos;
  readonly clase?: string;
  readonly children: ReactNode;
}) {
  return (
    <section data-grupo={titulo} className={['flex flex-col gap-3', clase].join(' ')}>
      <h2 className="flex items-baseline justify-between gap-3">
        <span className="text-titulo-seccion">{titulo}</span>
        {total === undefined ? null : (
          <span className="text-cuerpo-pequeno font-semibold">
            <Monto centavos={total} rol="cuerpo" />
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function PantallaCuentas({ dto }: { readonly dto: CuentasDto }) {
  const { posicionNeta, archivadas } = dto;
  const sinCuentas =
    dto.efectivo.length + dto.tarjetas.length + dto.prestamos.length + dto.inversiones.length ===
      0 && (archivadas ?? []).length === 0;
  const tarjetas: readonly TarjetaDto[] = dto.tarjetas.map((x, i) => ({
    ...x,
    color: i % 2 === 0 ? 'oro' : 'plata',
  }));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-titulo-pantalla">{p.titulo}</h1>
        <div className="flex items-center gap-2">
          {sinCuentas ? null : (
            <EnlaceFinn href="/cuentas/ordenar" className={BOTON}>
              {p.ordenar}
            </EnlaceFinn>
          )}
          <EnlaceFinn href="/cuentas/nueva" className={BOTON}>
            <Icono nombre="plus" tamano={18} />
            {p.nuevaCuenta}
          </EnlaceFinn>
        </div>
      </div>
      {sinCuentas ? (
        <Vacio
          titulo={p.vacioTitulo}
          texto={p.vacioTexto}
          accion={<EnlaceFinn href="/cuentas/nueva">{p.vacioAccion}</EnlaceFinn>}
        />
      ) : (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-x-10">
          <div className="flex flex-col gap-3 md:col-start-1">
            <PosicionNeta posicion={posicionNeta} />
            {dto.enCamino > 0 ? (
              <p data-en-camino className="flex flex-wrap items-center gap-2">
                <IndicadorEstado estado="informacion" etiqueta={glosario.enCamino} />
                <Monto centavos={dto.enCamino} rol="cuerpo" />
              </p>
            ) : null}
          </div>
          {tarjetas.length === 0 ? null : (
            <Grupo
              titulo={p.grupos.tarjetas}
              total={posicionNeta.deudas.tarjetas}
              clase="md:col-start-2 md:row-span-4 md:row-start-1 md:self-start"
            >
              <BilleteraTarjetas tarjetas={tarjetas} />
              <ul className="flex flex-col">
                {dto.tarjetas.map((x) => (
                  <li
                    key={x.cuenta.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="font-semibold">{x.cuenta.nombre}</span>
                    <span className="flex items-center">
                      <EnlaceFinn href={`/cuentas/${x.cuenta.id}`} className={ACCION}>
                        {p.verDetalle(x.cuenta.nombre)}
                      </EnlaceFinn>
                      <EnlaceFinn href={`/cuentas/${x.cuenta.id}/pagar`} className={ACCION}>
                        {p.pagar(x.cuenta.nombre)}
                      </EnlaceFinn>
                    </span>
                  </li>
                ))}
              </ul>
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
            {/* El interruptor es un enlace: cada estado tiene su URL y funciona sin hidratar. */}
            <EnlaceFinn
              href={archivadas === undefined ? '/cuentas?archivadas=1' : '/cuentas'}
              replace
              className={ACCION}
            >
              {archivadas === undefined ? p.mostrarArchivadas : p.ocultarArchivadas}
            </EnlaceFinn>
            {archivadas === undefined || archivadas.length === 0 ? null : (
              <Grupo titulo={p.grupos.archivadas}>
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
