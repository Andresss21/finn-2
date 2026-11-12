// El reporte `ritmo` (FT-62; 05 §2.10, 06 §3.5.4 y 3.5.5): la proyección del cierre arriba, los hallazgos con su acción y una
// fila por categoría con su disponible proyectado. Dibuja lo que trae el DTO: no calcula montos (PF-3). Sin hallazgos queda solo
// la proyección; una categoría sin compras suficientes lo dice en lugar de proyectar.
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { Monto } from '../../../../componentes/dominio/monto';
import { formatearFecha } from '../../../../formato';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { reportes as t } from '../../../../textos/reportes';
import { CifraReporte } from './cifra';
import { HallazgosRitmo } from './ritmo-hallazgos';
import { Tabla } from './vistas-detalle';

type Fila = ReporteDe<'ritmo'>['categorias'][number];

export function Ritmo({
  dto,
  asignar,
}: {
  readonly dto: ReporteDe<'ritmo'>;
  readonly asignar?: AccionEscritura;
}) {
  const { proyeccion: p } = dto;
  return (
    <div className="flex flex-col gap-6">
      <CifraReporte
        centavos={p.reduccionLpa}
        estado="problema"
        frase={t.cifras.ritmo(formatearFecha(dto.periodo.fin).slice(0, 5))}
      />
      <section data-proyeccion-cierre className="flex flex-col gap-2">
        <h3 className="text-titulo-seccion">
          {t.ritmo.cierre(formatearFecha(dto.periodo.fin).slice(0, 5))}
        </h3>
        <ul className="flex flex-col gap-1.5 text-cuerpo">
          <li data-sobregiradas={p.sobregiradas}>{t.ritmo.sobregiradas(p.sobregiradas)}</li>
          <li data-reduccion-lpa>
            {t.ritmo.reduccion} <Monto centavos={p.reduccionLpa} rol="cuerpo" />
          </li>
          {p.faltaReservar
            .filter((f) => f.proyectado > 0)
            .map((f) => (
              <li key={f.tarjeta.id} data-falta-reservar={f.tarjeta.id}>
                {t.ritmo.faltaReservar} <Monto centavos={f.proyectado} rol="cuerpo" />{' '}
                {t.ritmo.paraTarjeta(f.tarjeta.nombre)}
              </li>
            ))}
          <li data-sobrante>
            {t.ritmo.sobrante} <Monto centavos={p.sobrante} rol="cuerpo" /> {t.ritmo.enOtras}
          </li>
        </ul>
      </section>
      {/* Siempre montada: la salida «Deshacer» sigue en su lugar cuando la revalidación quita el hallazgo. */}
      <section data-hallazgos-ritmo className="flex flex-col gap-2.5">
        {dto.hallazgos.length === 0 ? null : (
          <h3 className="text-titulo-seccion">{t.ritmo.hallazgos}</h3>
        )}
        <HallazgosRitmo
          hallazgos={dto.hallazgos}
          periodoInicio={dto.periodo.inicio}
          {...(asignar === undefined ? {} : { asignar })}
        />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-titulo-seccion">{t.ritmo.porCategoria}</h3>
        <Tabla<Fila>
          titulo={t.ritmo.porCategoria}
          clave={(f) => f.categoria.id}
          filas={dto.categorias}
          columnas={[
            {
              id: 'categoria',
              celda: (f) => (
                <>
                  {f.categoria.nombre}
                  {f.evaluable ? null : (
                    <span
                      data-sin-proyeccion
                      className="block text-cuerpo-pequeno font-normal text-texto-secundario"
                    >
                      {t.ritmo.sinProyeccion}
                    </span>
                  )}
                </>
              ),
            },
            { id: 'disponible', celda: (f) => <Monto centavos={f.disponible} rol="cuerpo" /> },
            {
              id: 'alCierre',
              celda: (f) => <Monto centavos={f.disponibleProyectado} rol="cuerpo" />,
            },
          ]}
        />
      </section>
    </div>
  );
}
