// El reporte `suscripciones` (FT-65; 05 §2.10, 06 §3.5.9): los cobros mensuales repetidos que no están programados, con su costo
// mensual y anual y su acción de un toque, y «Ya programadas» con su costo anual. Dibuja lo que trae el DTO: no calcula montos (PF-3).
// Con menos de 4 períodos cerrados dice su propio estado (06 FT-65), no «No hay movimientos».
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { AvisoEnLinea } from '../../../../componentes/base/aviso';
import { Monto } from '../../../../componentes/dominio/monto';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn';
import { programadas as tp } from '../../../../textos/programadas';
import { reportes as t } from '../../../../textos/reportes';
import { CifraReporte } from './cifra';
import { HallazgosSuscripciones, type AccionesSuscripciones } from './suscripciones-hallazgos';
import { Tabla } from './vistas-detalle';

type Fila = ReporteDe<'suscripciones'>['programadas'][number];

const ENLACE =
  'inline-flex min-h-11 items-center text-etiqueta font-bold text-accion no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

export function Suscripciones({
  dto,
  acciones,
}: {
  readonly dto: ReporteDe<'suscripciones'>;
  readonly acciones?: AccionesSuscripciones;
}) {
  return (
    <div className="flex flex-col gap-6">
      {dto.hallazgos[0] === undefined ? null : (
        <CifraReporte
          centavos={dto.hallazgos[0].anual}
          frase={t.cifras.suscripciones(dto.hallazgos[0].comercio)}
        />
      )}
      {dto.suficiente ? null : (
        <AvisoEnLinea estado="informacion">{t.suscripciones.insuficiente}</AvisoEnLinea>
      )}
      {dto.suficiente && dto.hallazgos.length === 0 ? (
        <p data-sin-detectadas className="text-cuerpo-pequeno text-texto-secundario">
          {t.suscripciones.sinDetectadas}
        </p>
      ) : null}
      {/* Siempre montada: la salida «Deshacer» sigue en su lugar cuando la revalidación quita el hallazgo. */}
      <HallazgosSuscripciones
        hallazgos={dto.hallazgos}
        {...(acciones === undefined ? {} : { acciones })}
      />
      {dto.programadas.length === 0 ? null : (
        <section data-ya-programadas className="flex flex-col gap-3">
          <h3 className="text-titulo-seccion">{t.suscripciones.yaProgramadas}</h3>
          <Tabla<Fila>
            enfocable
            titulo={t.suscripciones.yaProgramadas}
            clave={(f) => f.programada.id}
            filas={dto.programadas}
            columnas={[
              { id: 'comercio', celda: (f) => f.comercio },
              { id: 'frecuencia', celda: (f) => tp.frecuencias[f.frecuencia] },
              { id: 'mensual', celda: (f) => <Monto centavos={f.mensual} rol="cuerpo" /> },
              { id: 'anual', celda: (f) => <Monto centavos={f.anual} rol="cuerpo" /> },
              {
                id: 'programada',
                celda: (f) => (
                  <EnlaceFinn href={`/programadas/${f.programada.id}`} className={ENLACE}>
                    {t.suscripciones.revisar(f.comercio)}
                  </EnlaceFinn>
                ),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}
