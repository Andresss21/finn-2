// Acciones y programadas del detalle de cuenta (FT-52, paso 4; CA-52.4). Una cuenta archivada es solo lectura (05 §7.7): las acciones
// que escriben quedan deshabilitadas con su motivo en texto y aparece "Desarchivar". Archivar y Eliminar son enlaces: sus bloqueos
// los explica su propio flujo (FT-53). Todo sale del DTO: no calcula nada (PF-3).
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { Boton } from '../../../../componentes/base/boton';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { cuentaDetalle as t } from '../../../../textos/cuenta-detalle';
import { Desarchivar } from './desarchivar';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const BOTON = `inline-flex min-h-11 items-center justify-center rounded-control bg-superficie-hundida px-4 font-semibold text-texto ${FOCO}`;

type Cuenta = DetalleCuentaDto['cuenta'];

interface Accion {
  readonly clave: string;
  readonly etiqueta: string;
  readonly href: string;
  /** Escribe en la cuenta: con la cuenta archivada queda deshabilitada (05 §7.7). */
  readonly escribe: boolean;
}

/** Las acciones del paso 4 que corresponden al tipo; una archivada muestra las de §7.7, deshabilitadas, sea cual sea su tipo. */
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

export function Acciones({
  cuenta,
  desarchivar,
  archivar,
}: {
  readonly cuenta: Cuenta;
  readonly desarchivar: AccionEscritura;
  readonly archivar: AccionEscritura;
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
        <Desarchivar
          cuentaId={cuenta.id}
          archivada={cuenta.archivada}
          accion={desarchivar}
          volver={archivar}
        />
      </ul>
    </section>
  );
}

export function Programadas({
  programadas,
}: {
  readonly programadas: DetalleCuentaDto['programadas'];
}) {
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
