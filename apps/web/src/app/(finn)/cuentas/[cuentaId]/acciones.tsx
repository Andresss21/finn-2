// Acciones y programadas del detalle de cuenta (FT-52, paso 4; CA-52.4; export `06-detalle-de-cuenta`). Las dos acciones de uso diario
// van como botones bajo la cabecera y el resto en «Más acciones» de la barra (P1-04). Una cuenta archivada es solo lectura
// (05 §7.7): Pagar, Cuota, Conciliar y Registrar quedan deshabilitadas con su motivo y aparece "Desarchivar". Los bloqueos de
// Archivar y Eliminar los da el DTO (PF-3); su flujo (FT-53) los explica. No calcula nada.
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import type { Centavos } from '@finn/dominio/valores';
import { Boton } from '../../../../componentes/base/boton';
import { Icono } from '../../../../componentes/base/icono';
import type { AccionPantalla } from '../../../../componentes/marco/publicar-acciones';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { formatearMonto } from '../../../../formato';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { cuentasGestion } from '../../../../textos/cuentas-gestion';
import { Desarchivar } from './desarchivar';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const PRINCIPAL = `inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;
const TONAL = `inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accion-tonal px-5 font-semibold text-accion ${FOCO}`;
const PRINCIPAL_ANCHO = `w-full ${PRINCIPAL}`;
const TONAL_ANCHO = `w-full ${TONAL}`;

type Cuenta = DetalleCuentaDto['cuenta'];

/** «Más acciones» de la barra: lo que el diseño deja fuera del contenido. Los motivos de bloqueo salen del DTO. */
export function menuDe(dto: DetalleCuentaDto): AccionPantalla[] {
  const { cuenta, acciones: a } = dto;
  const base = `/cuentas/${cuenta.id}`;
  const g = cuentasGestion;
  const dinero = (c: Centavos | undefined) => formatearMonto((c ?? 0) as Centavos);
  const motivoDe = (codigo: string): string =>
    codigo === 'cuenta_con_saldo'
      ? g.archivar.bloqueos.cuenta_con_saldo(cuenta.nombre, dinero(dto.saldo))
      : codigo === 'tarjeta_con_deuda'
        ? g.archivar.bloqueos.tarjeta_con_deuda(cuenta.nombre, dinero(dto.tarjeta?.deuda))
        : codigo === 'reserva_tarjeta_no_cero'
          ? g.archivar.bloqueos.reserva_tarjeta_no_cero(
              cuenta.nombre,
              dinero(dto.tarjeta?.reservado),
            )
          : codigo === 'cuenta_con_movimientos'
            ? g.eliminar.bloqueos.cuenta_con_movimientos(cuenta.nombre)
            : codigo === 'cuenta_con_programadas'
              ? g.eliminar.bloqueos.cuenta_con_programadas(cuenta.nombre, dto.programadas.length)
              : g.archivar.bloqueos.cuenta_ya_archivada(cuenta.nombre);
  // Todos los bloqueos del DTO, en orden: el diseño muestra el motivo en el propio menú
  const motivoArchivo = a.puedeArchivar ? undefined : a.bloqueosArchivo.map(motivoDe).join(' ');
  const motivoEliminar = a.puedeEliminar ? undefined : a.bloqueosEliminar.map(motivoDe).join(' ');
  const conSaldo = cuenta.tipo === 'efectivo' || cuenta.tipo === 'tarjeta';
  const escribe = (etiqueta: string, ruta: string, icono: 'check' | 'list'): AccionPantalla =>
    cuenta.archivada
      ? { etiqueta, motivo: t.acciones.motivoArchivada, icono }
      : { etiqueta, ruta, icono };
  return [
    { etiqueta: t.acciones.editar, ruta: `${base}/editar`, icono: 'edit' },
    ...(cuenta.tipo === 'tarjeta' || cuenta.tipo === 'prestamo'
      ? [{ etiqueta: t.acciones.condiciones, ruta: `${base}/condiciones`, icono: 'gear' } as const]
      : []),
    ...(conSaldo
      ? [
          escribe(t.acciones.verificarSaldo, `${base}/verificar-saldo`, 'check'),
          escribe(t.acciones.conciliarConEstado, `${base}/conciliar`, 'list'),
        ]
      : []),
    { etiqueta: t.acciones.ordenar, ruta: '/cuentas/ordenar', icono: 'grip' },
    ...(cuenta.archivada
      ? []
      : [
          motivoArchivo === undefined
            ? ({ etiqueta: t.acciones.archivar, ruta: `${base}/archivar`, icono: 'inbox' } as const)
            : ({ etiqueta: t.acciones.archivar, motivo: motivoArchivo, icono: 'lock' } as const),
        ]),
    motivoEliminar === undefined
      ? { etiqueta: t.acciones.eliminar, ruta: `${base}/eliminar`, icono: 'trash', peligro: true }
      : { etiqueta: t.acciones.eliminar, motivo: motivoEliminar, icono: 'trash', peligro: true },
  ];
}

/** Los dos botones del diseño: la acción propia del tipo (verificar saldo o pagar la tarjeta) y «Registrar». */
export function AccionesPrincipales({ cuenta }: { readonly cuenta: Cuenta }) {
  if (cuenta.archivada || (cuenta.tipo !== 'efectivo' && cuenta.tipo !== 'tarjeta')) return null;
  const base = `/cuentas/${cuenta.id}`;
  const tarjeta = cuenta.tipo === 'tarjeta';
  return (
    <ul className="grid grid-cols-2 gap-2">
      <li data-accion={tarjeta ? 'pagar' : 'verificar-saldo'}>
        <EnlaceFinn
          href={tarjeta ? `${base}/pagar` : `${base}/verificar-saldo`}
          className={PRINCIPAL_ANCHO}
        >
          {tarjeta ? t.acciones.pagarTarjeta : t.acciones.verificarSaldo}
        </EnlaceFinn>
      </li>
      <li data-accion="registrar">
        <EnlaceFinn href={`/registrar/gasto?cuenta=${cuenta.id}`} className={TONAL_ANCHO}>
          <Icono nombre="plus" tamano={18} />
          {t.acciones.registrar}
        </EnlaceFinn>
      </li>
    </ul>
  );
}

/** Archivada (CA-52.4): las acciones que escriben, deshabilitadas con el motivo, y «Desarchivar». */
export function AccionesArchivada({
  cuenta,
  desarchivar,
  archivar,
}: {
  readonly cuenta: Cuenta;
  readonly desarchivar: AccionEscritura;
  readonly archivar: AccionEscritura;
}) {
  const a = t.acciones;
  return (
    <ul className="flex flex-wrap items-start gap-2 empty:hidden">
      {cuenta.archivada
        ? (
            [
              ['pagar', a.pagar],
              ['cuota', a.cuota],
              ['conciliar', a.conciliar],
              ['registrar', a.registrar],
            ] as const
          ).map(([clave, etiqueta]) => (
            <li key={clave} data-accion={clave}>
              <Boton variante="secundaria" deshabilitado motivoDeshabilitado={a.motivoArchivada}>
                {etiqueta}
              </Boton>
            </li>
          ))
        : null}
      <Desarchivar
        cuentaId={cuenta.id}
        archivada={cuenta.archivada}
        accion={desarchivar}
        volver={archivar}
      />
    </ul>
  );
}

export function Programadas({
  programadas,
}: {
  readonly programadas: DetalleCuentaDto['programadas'];
}) {
  if (programadas.length === 0) return null;
  return (
    <section data-programadas className="flex flex-col gap-2.5">
      <h2 className="text-titulo-seccion">{t.programadas.titulo}</h2>
      <ul className="flex flex-col divide-y divide-borde-sutil overflow-hidden rounded-contenedor bg-superficie shadow-elevacion-1">
        {programadas.map((p) => (
          <li
            key={p.programada.id}
            className="grid min-h-14 grid-cols-[40px_minmax(0,1fr)] items-center gap-3 px-4 py-3"
          >
            <span className="flex size-10 items-center justify-center rounded-pastilla bg-superficie-hundida">
              <Icono nombre="repeat" tamano={20} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">{p.programada.nombre}</span>
              <span className="text-cuerpo-pequeno text-texto-secundario">
                {p.rol === 'origen' ? t.programadas.origen : t.programadas.destino}
                {p.activa ? '' : ` · ${t.programadas.inactiva}`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
