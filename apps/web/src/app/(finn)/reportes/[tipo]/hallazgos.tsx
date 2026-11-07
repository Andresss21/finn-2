'use client';
// El reporte `hallazgos` (FT-67; 05 §2.10, 06 §3.5.11 y 3.6): hasta 5 hallazgos del período activo, uno por clave y por impacto
// descendente, cada uno con la acción que ya tiene en su reporte de origen. Reutiliza esos componentes, uno por hallazgo para
// conservar el orden del DTO; los de un toque (ritmo, tarjeta, realidad, suscripción) conservan montado su componente aunque la revalidación
// quite el hallazgo, así «Deshacer» sigue en su lugar y el hallazgo reaparece al revertir (05 §4.14, regla 4). Dibuja lo que trae el
// DTO: no calcula montos (PF-3).
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { useState } from 'react';
import type { AccionEscritura } from '../../../../formularios/use-operacion';
import { reportes as t } from '../../../../textos/reportes';
import { AvisoHormiga } from './hormiga';
import { AvisoPromedio } from './realidad';
import { HallazgosRealidad, type AccionesRealidad } from './realidad-hallazgos';
import { HallazgosRitmo } from './ritmo-hallazgos';
import { HallazgosSuscripciones, type AccionesSuscripciones } from './suscripciones-hallazgos';
import { HallazgosTarjetas } from './tarjetas-hallazgos';

type Hallazgo = ReporteDe<'hallazgos'>['hallazgos'][number];

// Un hallazgo de un toque que ya no está en el DTO: se esconde el aviso y queda, si la hay, su salida «Deshacer».
const AUSENTE =
  '[&:not(:has([data-ritmo-asignado],[data-realidad-ajustado],[data-tarjetas-reservado],[data-suscripciones-hecho]))]:hidden [&_[data-hallazgo]]:hidden [&_[data-hallazgo-realidad]]:hidden [&_[data-hallazgo-tarjeta]]:hidden [&_[data-hallazgo-suscripcion]]:hidden';

const DE_UN_TOQUE: ReadonlySet<Hallazgo['tipo']> = new Set([
  'ritmo',
  'tarjeta',
  'realidad',
  'suscripcion',
]);

/** Identifica el componente: tras ejecutar un ritmo, la misma clave puede quedar con el de promedio y no debe reemplazarlo. */
const idDe = (h: Hallazgo): string => `${h.tipo}:${h.clave}`;

export function Hallazgos({
  dto,
  asignar,
  acciones,
  suscripciones,
}: {
  readonly dto: ReporteDe<'hallazgos'>;
  /** `asignarEnCategoria` (OP-14): la propuesta de un toque de ritmo; la pone el lector. */
  readonly asignar?: AccionEscritura;
  /** Los ajustes de un toque de realidad y tarjetas con lo vigente que vio la pantalla; los pone el lector. */
  readonly acciones?: AccionesRealidad;
  /** OP-42 y OP-51 de la suscripción de un toque; las pone el lector. */
  readonly suscripciones?: AccionesSuscripciones;
}) {
  // Los de un toque que se vieron: siguen montados tras revalidar (ver arriba).
  const [vistos, setVistos] = useState<ReadonlyMap<string, Hallazgo>>(new Map());
  const nuevos = dto.hallazgos.filter((h) => DE_UN_TOQUE.has(h.tipo));
  if (nuevos.some((h) => vistos.get(idDe(h)) !== h))
    setVistos(new Map([...vistos, ...nuevos.map((h): [string, Hallazgo] => [idDe(h), h])]));
  if (dto.hallazgos.length === 0 && vistos.size === 0)
    return (
      <p data-sin-hallazgos className="text-cuerpo-pequeno text-texto-secundario">
        {t.hallazgos.sinHallazgos}
      </p>
    );
  const presentes = new Set(dto.hallazgos.map(idDe));
  const ausentes = [...vistos.values()].filter((h) => !presentes.has(idDe(h)));
  const inicio = dto.periodo.inicio;
  const fila = (h: Hallazgo, ausente: boolean) => (
    <div key={idDe(h)} data-hallazgo-fila={h.clave} className={ausente ? AUSENTE : undefined}>
      {h.tipo === 'ritmo' ? (
        <HallazgosRitmo
          hallazgos={[h]}
          periodoInicio={inicio}
          {...(asignar === undefined ? {} : { asignar })}
        />
      ) : h.tipo === 'tarjeta' ? (
        <HallazgosTarjetas
          hallazgos={[h]}
          periodoInicio={inicio}
          {...(acciones === undefined ? {} : { acciones })}
        />
      ) : h.tipo === 'realidad' ? (
        <HallazgosRealidad
          hallazgos={[h]}
          periodoInicio={inicio}
          {...(acciones === undefined ? {} : { acciones })}
        />
      ) : h.tipo === 'hormiga' ? (
        <AvisoHormiga hallazgo={h} />
      ) : h.tipo === 'suscripcion' ? (
        <HallazgosSuscripciones
          hallazgos={[h]}
          {...(suscripciones === undefined ? {} : { acciones: suscripciones })}
        />
      ) : (
        <AvisoPromedio hallazgo={h} />
      )}
    </div>
  );
  return (
    <div data-hallazgos className="flex flex-col gap-2.5">
      {/* Una sola lista: al pasar a ausente, el componente conserva su estado (y su «Deshacer»). */}
      {[...dto.hallazgos.map((h) => fila(h, false)), ...ausentes.map((h) => fila(h, true))]}
    </div>
  );
}
