// `/presupuesto/categorias/[categoriaId]` (FT-14; 06-identidad-visual §6): de dónde sale el Disponible de una categoría. Dibuja
// lo que trae el DTO: no calcula montos (PF-3) ni períodos (05 §3.4). Los montos del sobregiro aparecen acá, al tocar la fila
// (PF-2). Período cerrado: sin acciones de asignación (inv. 18). Archivada: sin asignar ni mover hacia ella, con «Sacar» y
// «Desarchivar». La categoría de pago de tarjeta es de FT-29.
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import type { Centavos } from '@finn/dominio/valores';
import type { ReactNode } from 'react';
import { Boton } from '../../../../../componentes/base/boton';
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { IndicadorEstado } from '../../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../../componentes/dominio/monto';
import type { AccionEscritura } from '../../../../../formularios/use-operacion';
import { PublicarEncabezado } from '../../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../../../componentes/navegacion/selector-periodo';
import { formatearFecha, formatearMonto } from '../../../../../formato';
import { categoriaDetalle as t } from '../../../../../textos/categoria-detalle';
import { Consumos } from './consumos';
import { Desarchivar } from './desarchivar';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;
const PRINCIPAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;
const TONAL = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;
const CONTENEDOR = 'flex flex-col divide-y divide-borde-sutil rounded-contenedor bg-superficie';

function Seccion({
  titulo,
  atributo,
  children,
}: {
  readonly titulo: string;
  readonly atributo: string;
  readonly children: ReactNode;
}) {
  return (
    <section data-seccion={atributo} className="flex flex-col gap-2">
      <h2 className="text-titulo-seccion">{titulo}</h2>
      {children}
    </section>
  );
}

export function PantallaDetalleCategoria({
  dto,
  desarchivar,
}: {
  readonly dto: DetalleCategoriaDto;
  readonly desarchivar: AccionEscritura;
}) {
  const { categoria, periodoActivo } = dto;
  const conPeriodo = (ruta: string): string =>
    dto.periodo.inicio === periodoActivo.inicio ? ruta : `${ruta}?periodo=${dto.periodo.inicio}`;
  const volver = (
    <EnlaceFinn href={conPeriodo('/presupuesto')} className={ENLACE}>
      {t.volver}
    </EnlaceFinn>
  );
  const raiz = `/presupuesto/categorias/${categoria.id}`;
  if (dto.clase === 'pago')
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-4">
        <PublicarEncabezado encabezado={dto} />
        {volver}
        <h1 className="text-titulo-pantalla">{categoria.nombre}</h1>
        <p className="text-cuerpo-pequeno text-texto-secundario">{t.pago.titulo}</p>
      </main>
    );

  const { numeros, sobregiro, acciones, periodo } = dto;
  const cerrado = periodo.estado === 'cerrado';
  const archivada = categoria.archivada === true;
  const tarjetas = [
    ...new Set(dto.consumos.filter((x) => x.medio === 'tarjeta').map((x) => x.cuenta.nombre)),
  ];
  const estadoDisponible =
    sobregiro === null
      ? undefined
      : sobregiro.tipo === 'tarjeta'
        ? 'deuda-sin-respaldo'
        : 'problema';
  const bloqueo = acciones.bloqueosArchivo[0];
  const hrefAsignar = conPeriodo(`/presupuesto/asignar/${categoria.id}`);
  const numero = (rotulo: string, centavos: Centavos) => (
    <div key={rotulo} className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-rotulo text-texto-secundario">{rotulo}</dt>
      <dd className="font-semibold">
        <Monto centavos={centavos} />
      </dd>
    </div>
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-4 md:grid md:grid-cols-[1fr_1.6fr] md:items-start md:gap-x-8">
      <PublicarEncabezado encabezado={dto} />
      <div className="flex flex-col gap-3 md:col-span-2">
        {volver}
        <SelectorPeriodo
          periodo={periodo}
          periodoActivo={periodoActivo}
          {...(dto.navegacion.anterior === undefined ? {} : { anterior: dto.navegacion.anterior })}
          {...(dto.navegacion.siguiente === undefined
            ? {}
            : { siguiente: dto.navegacion.siguiente })}
          ruta={raiz}
          parametros={{}}
        />
        {cerrado ? <AvisoEnLinea estado="informacion">{t.periodoCerrado}</AvisoEnLinea> : null}
      </div>

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-rotulo text-texto-secundario">{dto.grupo.nombre}</p>
          <h1 className="text-titulo-pantalla">{categoria.nombre}</h1>
          {archivada ? <p className="text-etiqueta">{t.archivada}</p> : null}
          <div>
            <p className="text-cuerpo-pequeno">{t.numeros.disponible}</p>
            <p>
              <Monto
                centavos={numeros.disponible}
                rol="cifra-principal"
                {...(estadoDisponible ? { estado: estadoDisponible } : {})}
              />
            </p>
          </div>
          {sobregiro === null ? null : (
            <div className="flex flex-wrap gap-2">
              {sobregiro.parteDebito === 0 ? null : (
                <IndicadorEstado estado="problema" etiqueta={t.sobregiro.debito} />
              )}
              {sobregiro.parteTarjeta === 0 ? null : (
                <IndicadorEstado estado="deuda-sin-respaldo" etiqueta={t.sobregiro.tarjeta} />
              )}
            </div>
          )}
        </header>

        <dl data-numeros className="grid grid-cols-3 gap-3 rounded-contenedor bg-superficie p-3.5">
          {numero(t.numeros.asignado, numeros.asignado)}
          {numero(t.numeros.gastado, numeros.gastado)}
          {numero(t.numeros.arrastre, numeros.arrastre)}
          {numero(t.numeros.fondo, numeros.fondo)}
          {numero(t.numeros.entradas, numeros.entradas)}
        </dl>

        {sobregiro === null ? null : (
          <div data-sobregiro={sobregiro.tipo} className="flex flex-col gap-2">
            {sobregiro.parteDebito === 0 ? null : (
              <AvisoEnLinea estado="problema" titulo={t.sobregiro.debito}>
                {t.sobregiro.conDebito} <Monto centavos={sobregiro.parteDebito} />.{' '}
                {t.sobregiro.alCerrar} <Monto centavos={sobregiro.parteDebito} />.
              </AvisoEnLinea>
            )}
            {sobregiro.parteTarjeta === 0 ? null : (
              <AvisoEnLinea estado="deuda-sin-respaldo" titulo={t.sobregiro.tarjeta}>
                {t.sobregiro.conTarjeta} <Monto centavos={sobregiro.parteTarjeta} />.{' '}
                {t.sobregiro.deudaEnCategoria(
                  categoria.nombre,
                  formatearMonto(sobregiro.parteTarjeta),
                )}
                . {tarjetas.map((x) => `${t.sobregiro.sumaALoQueFalta(x)}.`).join(' ')}
              </AvisoEnLinea>
            )}
            {acciones.puedeAsignar && !cerrado ? (
              <EnlaceFinn href={hrefAsignar} className={PRINCIPAL}>
                {sobregiro.tipo === 'tarjeta' ? t.sobregiro.reservar : t.sobregiro.cubrir}{' '}
                <Monto centavos={sobregiro.total} />
              </EnlaceFinn>
            ) : null}
          </div>
        )}

        <nav aria-label={t.acciones.etiqueta} className="flex flex-col gap-2">
          {acciones.puedeAsignar && !cerrado ? (
            <div className="grid grid-cols-2 gap-2">
              <EnlaceFinn href={hrefAsignar} className={PRINCIPAL}>
                {t.acciones.asignar}
              </EnlaceFinn>
              <EnlaceFinn
                href={conPeriodo(`/presupuesto/mover?categoria-origen=${categoria.id}`)}
                className={TONAL}
              >
                {t.acciones.mover}
              </EnlaceFinn>
            </div>
          ) : null}
          {archivada ? (
            <>
              {numeros.disponible > 0 ? (
                <EnlaceFinn href={`${raiz}/sacar`} className={TONAL}>
                  {t.acciones.sacar}
                </EnlaceFinn>
              ) : null}
              <Desarchivar categoriaId={categoria.id} accion={desarchivar} />
            </>
          ) : (
            <>
              {bloqueo === undefined && acciones.puedeArchivar ? (
                <EnlaceFinn href={`${raiz}/archivar`} className={TONAL}>
                  {t.acciones.archivar}
                </EnlaceFinn>
              ) : (
                <Boton
                  variante="secundaria"
                  deshabilitado
                  motivoDeshabilitado={t.acciones.bloqueos[bloqueo ?? 'disponible']}
                >
                  {t.acciones.archivar}
                </Boton>
              )}
              <EnlaceFinn href={`${raiz}/fusionar`} className={ENLACE}>
                {t.acciones.fusionar}
              </EnlaceFinn>
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        <Consumos consumos={dto.consumos} volver={conPeriodo(raiz)} />
        {dto.entradasDelPeriodo.length === 0 ? null : (
          <Seccion titulo={t.consumos.entradas} atributo="entradas">
            <ul className={CONTENEDOR}>
              {dto.entradasDelPeriodo.map((e) => (
                <li
                  key={`${e.transaccionId}-${e.fecha}`}
                  className="flex items-center justify-between gap-3 px-3.5 py-3"
                >
                  <EnlaceFinn
                    href={`/actividad/${e.transaccionId}?volver=${encodeURIComponent(conPeriodo(raiz))}`}
                    className={ENLACE}
                  >
                    {formatearFecha(e.fecha)}
                  </EnlaceFinn>
                  <Monto centavos={e.monto} />
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>
    </main>
  );
}
