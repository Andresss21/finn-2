// Aviso en línea (06-identidad-visual 2.14, 05 §10.7). [CH-286] Línea compacta de C-51 (`docs/anexos/finn-avisos-en-linea/`,
// AVISOS-EN-LINEA §2 y §6): una sola forma para toda la familia, sin caja teñida. `--superficie-elevada` sobre `--fondo` y
// `--superficie-hundida` dentro de una superficie (lo resuelve `globals.css`); pastilla si es una línea, rectángulo si tiene
// descripción. Tres señales por tono: color del glifo, forma del glifo y título, con el tono nombrado oculto antes del título.
// La acción es siempre un enlace de texto, aunque llegue como botón con fondo (`.fz-aviso-accion`); el problema suma su borde.
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../components/ui/utils';
import { base } from '../../textos/base';
import { Icono, type NombreIcono } from './icono';

export type EstadoFinanciero =
  'positivo' | 'cero' | 'advertencia' | 'problema' | 'deuda' | 'deuda-sin-respaldo' | 'informacion';

// Clases completas (no armadas con plantillas) para que Tailwind las encuentre.
const COLOR_GLIFO: Record<EstadoFinanciero, string> = {
  positivo: 'text-positivo-texto',
  cero: 'text-cero-texto',
  advertencia: 'text-advertencia-texto',
  problema: 'text-problema-texto',
  deuda: 'text-deuda-texto',
  'deuda-sin-respaldo': 'text-deuda-sin-respaldo-texto',
  informacion: 'text-informacion-texto',
};
// §2: `info`, `warn`, `dang` y `check`; los demás estados conservan su glifo.
const GLIFO: Partial<Record<EstadoFinanciero, NombreIcono>> = {
  informacion: 'info',
  advertencia: 'warn',
  problema: 'dang',
  positivo: 'check',
};
/** Hasta este largo un título sin descripción entra en una línea del teléfono: pastilla (§2, «Forma»). */
const LARGO_PASTILLA = 40;

export interface PropsAvisoEnLinea extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title' | 'role'
> {
  readonly estado: EstadoFinanciero;
  /** Con título, `children` es la descripción, en su propia línea; sin él, `children` es el título. */
  readonly titulo?: ReactNode;
  readonly children?: ReactNode;
  /** Un enlace o un botón: se ve como enlace de texto (`--enlace`, 700, 44 px). */
  readonly accion?: ReactNode;
  /** `true` si aparece después de cargar la pantalla: `role="status"` (`alert` si es un problema); si viene con ella, sin rol. */
  readonly aparecioDespues?: boolean;
  /** Un glifo propio del caso (`refresh`, `wifioff`, `undo`, `lock`) en lugar del del tono. */
  readonly icono?: NombreIcono;
  /** Por omisión, pastilla si es un título corto sin descripción. */
  readonly forma?: 'pastilla' | 'rectangulo';
  /** Solo las bandas de C-50 §9: la × de 44 × 44. */
  readonly alCerrar?: () => void;
  /** El aviso momentáneo mientras se va (opacidad en `--duracion-normal`). */
  readonly fase?: 'visible' | 'saliendo';
}

export function AvisoEnLinea({
  estado,
  titulo,
  children,
  accion,
  aparecioDespues = false,
  icono,
  forma,
  alCerrar,
  fase,
  className,
  ...resto
}: PropsAvisoEnLinea) {
  const encabezado = titulo ?? children;
  const descripcion = titulo === undefined ? undefined : children;
  const pastilla =
    forma === undefined
      ? descripcion === undefined &&
        typeof encabezado === 'string' &&
        encabezado.length <= LARGO_PASTILLA
      : forma === 'pastilla';
  const rol = aparecioDespues ? (estado === 'problema' ? 'alert' : 'status') : undefined;
  const conAccion = accion === undefined || accion === null ? null : (
    <div className="fz-aviso-accion">{accion}</div>
  );
  return (
    <div
      {...resto}
      {...(rol === undefined ? {} : { role: rol })}
      data-aviso-en-linea=""
      data-estado={estado}
      data-forma={pastilla ? 'pastilla' : 'rectangulo'}
      {...(fase === undefined ? {} : { 'data-fase': fase })}
      className={cn('fz-aviso', className)}
    >
      <span className={cn('fz-aviso-glifo', COLOR_GLIFO[estado])}>
        <Icono nombre={icono ?? GLIFO[estado] ?? estado} tamano={18} trazo={1.7} />
      </span>
      <div className="fz-aviso-texto">
        <div className="fz-aviso-titulo">
          <span className="sr-only">{`${base.tonos[estado]}: `}</span>
          {encabezado}
        </div>
        {descripcion === undefined ? null : (
          <div className="fz-aviso-descripcion">{descripcion}</div>
        )}
        {pastilla ? null : conAccion}
      </div>
      {pastilla ? conAccion : null}
      {alCerrar === undefined ? null : (
        <button
          type="button"
          onClick={alCerrar}
          aria-label={base.cerrarAviso}
          className="fz-aviso-cerrar"
        >
          <Icono nombre="x" tamano={18} />
        </button>
      )}
    </div>
  );
}
