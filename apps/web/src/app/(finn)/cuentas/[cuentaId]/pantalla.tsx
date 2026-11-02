// `/cuentas/[cuentaId]` (FT-52; 06-identidad-visual §9): cabecera con saldo y saldo confirmado, acciones, período, el bloque del tipo
// de cuenta, conciliaciones, programadas y movimientos con saldo corrido. Dibuja lo que trae el DTO: no calcula montos (PF-3) y la
// navegación de períodos usa solo `navegacion` (la interfaz nunca calcula un período, 05 §3.4). Una cuenta archivada es solo
// lectura (05 §7.7): las acciones que escriben quedan deshabilitadas con su motivo en texto y aparece "Desarchivar".
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Boton } from '../../../../componentes/base/boton';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { IndicadorEstado } from '../../../../componentes/dominio/indicador-estado';
import { Monto } from '../../../../componentes/dominio/monto';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { SelectorPeriodo } from '../../../../componentes/navegacion/selector-periodo';
import { formatearFecha } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { dominio } from '../../../../textos/dominio';
import { Conciliaciones } from './conciliaciones';
import { Desarchivar } from './desarchivar';
import { hrefDe, Movimientos, type FiltrosDetalle } from './movimientos';
import { BloqueInversion, BloquePrestamo, BloqueTarjeta } from './por-tipo';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;
const ENLACE = `inline-flex min-h-11 items-center rounded-control px-2 font-semibold text-texto underline ${FOCO}`;

type Cuenta = DetalleCuentaDto['cuenta'];

interface Accion {
  readonly clave: string;
  readonly etiqueta: string;
  readonly href: string;
  /** Escribe en la cuenta: con la cuenta archivada queda deshabilitada (05 §7.7). */
  readonly escribe: boolean;
}

/** Las acciones de la ficha (paso 4) que corresponden al tipo; una archivada muestra las cuatro de §7.7, deshabilitadas. */
function accionesDe(c: Cuenta): readonly Accion[] {
  const base = `/cuentas/${c.id}`;
  const a = t.acciones;
  const conMovimiento = c.tipo === 'efectivo' || c.tipo === 'tarjeta';
  const lista: Accion[] = [];
  const poner = (clave: string, etiqueta: string, ruta: string, escribe: boolean) =>
    lista.push({ clave, etiqueta, href: ruta, escribe });
  poner('editar', a.editar, `${base}/editar`, false);
  if (c.tipo === 'tarjeta' || c.tipo === 'prestamo')
    poner('condiciones', a.condiciones, `${base}/condiciones`, false);
  if (c.tipo === 'tarjeta' || c.archivada) poner('pagar', a.pagar, `${base}/pagar`, true);
  if (c.tipo === 'prestamo' || c.archivada) poner('cuota', a.cuota, `${base}/cuota`, true);
  if (conMovimiento || c.archivada) {
    poner('conciliar', a.conciliar, `${base}/conciliar`, true);
    poner('verificar-saldo', a.verificarSaldo, `${base}/verificar-saldo`, true);
    poner('registrar', a.registrar, `/registrar/gasto?cuenta=${c.id}`, true);
  }
  if (!c.archivada) poner('archivar', a.archivar, `${base}/archivar`, false);
  poner('eliminar', a.eliminar, `${base}/eliminar`, false);
  return lista;
}

function Acciones({
  cuenta,
  desarchivar,
}: {
  readonly cuenta: Cuenta;
  readonly desarchivar: AccionEscritura;
}) {
  return (
    <section aria-label={t.acciones.titulo} className="flex flex-col gap-2">
      <ul className="flex flex-wrap items-start gap-2">
        {accionesDe(cuenta).map((x) => (
          <li key={x.clave} data-accion={x.clave}>
            {cuenta.archivada && x.escribe ? (
              <Boton
                variante="secundaria"
                deshabilitado
                motivoDeshabilitado={t.acciones.motivoArchivada}
              >
                {x.etiqueta}
              </Boton>
            ) : (
              <EnlaceFinn href={x.href} className={BOTON}>
                {x.etiqueta}
              </EnlaceFinn>
            )}
          </li>
        ))}
        {cuenta.archivada ? (
          <li data-accion="desarchivar">
            <Desarchivar cuentaId={cuenta.id} accion={desarchivar} />
          </li>
        ) : null}
      </ul>
    </section>
  );
}

/** Sin `?periodo=` es el selector de 05 §3.4 sobre el período activo; con él, el DTO no trae el período elegido: solo sus vecinos. */
function Periodo({
  dto,
  filtros,
}: {
  readonly dto: DetalleCuentaDto;
  readonly filtros: FiltrosDetalle;
}) {
  const id = dto.cuenta.id;
  const { anterior, siguiente } = dto.navegacion;
  if (filtros.periodo === undefined)
    return (
      <SelectorPeriodo
        periodo={dto.periodoActivo}
        periodoActivo={dto.periodoActivo}
        {...(anterior === undefined ? {} : { anterior })}
        {...(siguiente === undefined ? {} : { siguiente })}
        ruta={`/cuentas/${id}`}
        parametros={Object.fromEntries(
          Object.entries({ tipo: filtros.tipo, estado: filtros.estado }).filter(
            (e): e is [string, string] => e[1] !== undefined,
          ),
        )}
      />
    );
  const ir = (inicio: string | undefined) =>
    hrefDe(id, filtros, { periodo: inicio, cursor: undefined });
  return (
    <nav
      aria-label={dominio.periodo.navegacion}
      data-selector-periodo="elegido"
      className="flex flex-wrap items-center justify-between gap-2 rounded-contenedor bg-superficie px-3 py-2.5"
    >
      {anterior === undefined ? null : (
        <EnlaceFinn href={ir(anterior)} className={ENLACE}>
          {dominio.periodo.anterior}
        </EnlaceFinn>
      )}
      <p className="font-bold">{t.periodo.desde(formatearFecha(filtros.periodo))}</p>
      {siguiente === undefined ? null : (
        <EnlaceFinn href={ir(siguiente)} className={ENLACE}>
          {dominio.periodo.siguiente}
        </EnlaceFinn>
      )}
      <EnlaceFinn href={ir(undefined)} className={ENLACE}>
        {dominio.periodo.irAlActual}
      </EnlaceFinn>
    </nav>
  );
}

function Programadas({ programadas }: { readonly programadas: DetalleCuentaDto['programadas'] }) {
  if (programadas.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-titulo-seccion">{t.programadas.titulo}</h2>
      <ul className="flex flex-col gap-1">
        {programadas.map((p) => (
          <li key={p.programada.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{p.programada.nombre}</span>
            <span className="text-cuerpo-pequeno text-texto-secundario">
              {p.rol === 'origen' ? t.programadas.origen : t.programadas.destino}
              {p.activa ? '' : ` · ${t.programadas.inactiva}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PantallaDetalleCuenta({
  dto,
  filtros,
  desarchivar,
}: {
  readonly dto: DetalleCuentaDto;
  readonly filtros: FiltrosDetalle;
  /** La Server Action de OP-05: la pasa el lector. */
  readonly desarchivar: AccionEscritura;
}) {
  const { cuenta } = dto;
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
      <Acciones cuenta={cuenta} desarchivar={desarchivar} />
      {dto.tarjeta === undefined ? null : <BloqueTarjeta tarjeta={dto.tarjeta} />}
      {dto.prestamo === undefined ? null : <BloquePrestamo prestamo={dto.prestamo} />}
      {dto.inversion === undefined ? null : <BloqueInversion inversion={dto.inversion} />}
      <Conciliaciones conciliaciones={dto.conciliaciones} />
      <Programadas programadas={dto.programadas} />
      <Periodo dto={dto} filtros={filtros} />
      <Movimientos dto={dto} filtros={filtros} />
    </main>
  );
}
