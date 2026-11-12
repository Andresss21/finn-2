// Lector de `/registrar` (05 §2.4): llama a `cuentas()` y ofrece solo los tipos de registro que tienen la cuenta que necesitan: el gasto
// pide una cuenta de efectivo o una tarjeta, el ingreso una de efectivo y la transferencia dos de efectivo. Sin cuentas, enlaza a
// `/cuentas/nueva`. La devolución pide una cuenta de efectivo o una tarjeta (D4). Los demás tipos (pagar tarjeta, cuota, cobro…)
// los agregan sus fichas. Lo único que traduce los errores de la
// consulta es `consultar()`.
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { Icono, type NombreIcono } from '../../componentes/base/icono';
import { Vacio } from '../../componentes/base/vacio';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { registrarInversion as inv } from '../../textos/registrar-inversion';
import { registrarDesembolso as d } from '../../textos/registrar-desembolso';
import { registrarTarjeta as k } from '../../textos/registrar-tarjeta';
import { ResultadoAvance } from './avance-guardado';
import { registrarDevolucion as dev } from '../../textos/registrar-devolucion';

const FOCO = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const FILA = `flex min-h-14 items-center gap-3 rounded-control bg-superficie px-4 py-2 ${FOCO}`;
const BOTON = `inline-flex min-h-12 items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion ${FOCO}`;

export async function LectorRegistrar() {
  const dto = await consultar(async () => cuentas(await depsDeConsulta()));
  const conDinero = dto.efectivo.length + dto.tarjetas.length;
  // [CH-240 E3-20] El orden y los íconos del diseño; los tipos que las cuentas no permiten no aparecen y la nota dice por qué
  const tipos: readonly { href: string; titulo: string; detalle: string; icono: NombreIcono }[] = [
    ...(conDinero >= 1
      ? [
          {
            href: '/registrar/gasto',
            titulo: t.tipoGasto,
            detalle: t.tipoGastoDetalle,
            icono: 'out' as const,
          },
        ]
      : []),
    ...(dto.efectivo.length >= 1
      ? [
          {
            href: '/registrar/ingreso',
            titulo: t.tipoIngreso,
            detalle: t.tipoIngresoDetalle,
            icono: 'in' as const,
          },
        ]
      : []),
    ...(dto.efectivo.length >= 2
      ? [
          {
            href: '/registrar/transferencia',
            titulo: t.tipoTransferencia,
            detalle: t.tipoTransferenciaDetalle,
            icono: 'swap' as const,
          },
        ]
      : []),
    // FT-28 (D4): la devolución vuelve a una cuenta de efectivo o a una tarjeta, con o sin la compra original.
    ...(conDinero >= 1
      ? [{ href: '/registrar/devolucion', ...dev.tipo, icono: 'undo' as const }]
      : []),
    // FT-57: sin inversiones no se ofrece ninguno de los tres (05 §7); aportar y retirar también piden efectivo.
    ...(dto.inversiones.length >= 1 && dto.efectivo.length >= 1
      ? [
          {
            href: '/registrar/aporte-inversion',
            titulo: inv.tipoAporte,
            detalle: inv.tipoAporteDetalle,
            icono: 'trend' as const,
          },
          {
            href: '/registrar/retiro-inversion',
            titulo: inv.tipoRetiro,
            detalle: inv.tipoRetiroDetalle,
            icono: 'trend' as const,
          },
        ]
      : []),
    ...(dto.inversiones.length >= 1
      ? [
          {
            href: '/registrar/ajuste-inversion',
            titulo: inv.tipoAjuste,
            detalle: inv.tipoAjusteDetalle,
            icono: 'trend' as const,
          },
        ]
      : []),
    ...(dto.prestamos.length >= 1 && dto.efectivo.length >= 1
      ? [{ href: '/registrar/desembolso', ...d.tipo, icono: 'bank' as const }]
      : []),
    ...(dto.tarjetas.length >= 1 && dto.efectivo.length >= 1
      ? [{ href: '/registrar/avance', ...k.tipos.avance, icono: 'card' as const }]
      : []),
    ...(dto.tarjetas.length >= 1
      ? [{ href: '/registrar/entrada-tarjeta', ...k.tipos.entrada, icono: 'coins' as const }]
      : []),
    ...(dto.tarjetas.length >= 2
      ? [{ href: '/registrar/transferencia-deuda', ...k.tipos.deuda, icono: 'swap' as const }]
      : []),
  ];
  // Lo que falta para un tipo que se conoce y no se ofrece, en una nota fija (E3-23)
  const motivos = [
    ...(dto.efectivo.length === 1 ? [t.sinTransferencia] : []),
    ...(dto.prestamos.length === 0 && dto.efectivo.length >= 1 ? [t.sinDesembolso] : []),
    ...(dto.tarjetas.length === 1 ? [t.sinDeuda] : []),
  ];
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/">
      {tipos.length === 0 ? (
        <Vacio
          titulo={t.sinCuentasTitulo}
          texto={t.sinCuentasTexto}
          accion={
            <EnlaceFinn href="/cuentas/nueva" className={BOTON}>
              {t.crearCuenta}
            </EnlaceFinn>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ResultadoAvance />
          <h2 className="text-titulo-seccion">{t.elegir}</h2>
          <ul className="flex flex-col gap-2">
            {tipos.map((x) => (
              <li key={x.href}>
                <EnlaceFinn href={x.href} className={FILA}>
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accion-tonal text-accion"
                  >
                    <Icono nombre={x.icono} tamano={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-cuerpo font-bold">{x.titulo}</span>
                    <span className="text-cuerpo-pequeno text-texto-secundario">{x.detalle}</span>
                  </span>
                  <Icono nombre="chevR" tamano={16} className="text-texto-terciario" />
                </EnlaceFinn>
              </li>
            ))}
          </ul>
          {motivos.length === 0 ? null : (
            <p data-rol="nota-tipos" className="text-cuerpo-pequeno text-texto-terciario">
              {t.notaTipos(motivos.join('; '))}
            </p>
          )}
        </div>
      )}
    </PaginaFlujoDeRuta>
  );
}
