'use client';
// Un movimiento que al abrir el flujo ya estaba aprobado o descartado (FT-35, FT-37; S4 del export, CH-137): su estado, el SMS, sus datos en
// solo lectura y, en el pie, «Restaurar» (si está descartado, OP-39) y «Volver a la Bandeja». Se carga cuando hace falta.
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Icono } from '../../componentes/base/icono';
import { Resultado } from '../../componentes/base/resultado';
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { EnlaceFinn } from '../../componentes/navegacion/enlace-finn';
import { formatearFecha, formatearMonto } from '../../formato';
import { useOperacion } from '../../formularios/use-operacion';
import { descartarMovimiento } from '../../servidor/acciones/bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { textoRestaurado } from './descarte';
import Encabezado, { type ResumenDelMovimiento } from './encabezado';
import { TablaDatos } from './piezas';
import { TextoDelSms } from './texto-sms';

// Clases literales (L13): el enlace de volver con el aspecto del botón principal o del tonal (D1)
const ENLACE = {
  principal:
    'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion px-5 font-semibold text-texto-sobre-accion',
  tonal:
    'inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accion-tonal px-5 font-semibold text-accion',
} as const;

export default function YaResuelto({
  aprobado,
  movimientoId,
  sms,
  nota,
  resumen: r,
}: {
  readonly aprobado: boolean;
  readonly movimientoId: string;
  readonly sms: string;
  readonly nota: string | null;
  readonly resumen: ResumenDelMovimiento;
}) {
  const restaurar = useOperacion({ accion: descartarMovimiento });
  const restaurado = restaurar.estado === 'listo';
  const filas: [string, string][] = [
    ...(r.cuenta === null ? [] : [[g.cuenta, r.cuenta] as [string, string]]),
    ...(r.fecha === null ? [] : [[g.fecha, formatearFecha(r.fecha)] as [string, string]]),
    ...(r.monto === null ? [] : [[t.revisar.monto, formatearMonto(r.monto)] as [string, string]]),
    ...(r.comercio === null ? [] : [[g.comercio, r.comercio] as [string, string]]),
    ...(nota === null || nota === '' ? [] : [[g.nota, nota] as [string, string]]),
  ];
  const pie = (
    <div className="flex w-full flex-col gap-2">
      {aprobado || restaurado ? null : (
        <Boton
          enviando={restaurar.estado === 'enviando'}
          textoEnviando={t.revisar.aprobando}
          deshabilitado={!restaurar.enLinea}
          className="w-full"
          onClick={() => {
            void restaurar.enviar({ movimientoId, accion: 'restaurar' });
          }}
        >
          <Icono nombre="undo" tamano={18} />
          {t.restaurar}
        </Boton>
      )}
      <EnlaceFinn
        href="/bandeja"
        className={aprobado || restaurado ? ENLACE.principal : ENLACE.tonal}
      >
        {t.revisar.volver}
      </EnlaceFinn>
    </div>
  );
  return (
    <PaginaFlujoDeRuta titulo={t.revisar.titulo} rutaPadre="/bandeja" acciones={pie}>
      <div className="flex flex-col gap-5">
        <Encabezado resumen={{ ...r, final: aprobado ? 'aprobado' : 'descartado' }} />
        {restaurado ? (
          <Resultado texto={textoRestaurado(r.comercio, r.monto)} />
        ) : (
          <AvisoEnLinea estado="informacion">
            {aprobado ? t.revisar.aprobadoYa : t.revisar.descartadoYa}
          </AvisoEnLinea>
        )}
        {restaurar.error === undefined ? null : (
          <AvisoEnLinea estado="problema" aparecioDespues>
            {restaurar.error.mensaje}
          </AvisoEnLinea>
        )}
        <TextoDelSms texto={sms} />
        {filas.length === 0 ? null : (
          <section aria-label={t.revisar.soloLectura} className="flex flex-col gap-2">
            <h2 className="text-rotulo text-texto-secundario">{t.revisar.soloLectura}</h2>
            <TablaDatos filas={filas} />
          </section>
        )}
      </div>
    </PaginaFlujoDeRuta>
  );
}
