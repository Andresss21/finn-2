// Billete y franja de "Listo para asignar" (05 §10.8.1, CF-13; 06-identidad-visual 2.8). Presenta los montos del DTO
// sin calcular (PF-3). Guilloché, resplandor, brillo y cifras que ruedan son decorativos: la información está en el
// texto, y con movimiento reducido no hay animación (11.6, regla global de globals.css).
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto, formatearMontoAccesible } from '../../formato';
import { dominio } from '../../textos/dominio';
import { Icono } from '../base/icono';
import { EnlaceFinn } from '../navegacion/enlace-finn';
import { CifrasBillete } from './cifras-billete';
import { IndicadorEstado } from './indicador-estado';

export interface ResumenListoParaAsignarProps {
  readonly lpa: Centavos;
  readonly enCamino: Centavos;
  readonly lpaNegativo: boolean;
  readonly variante: 'billete' | 'franja';
  readonly accion?: { readonly href: string; readonly texto: string };
}

// Dos anillos de `--marca-grabado` desde esquinas opuestas (anillos de 7–8 px y de 9–10 px), como en el export (K3, S1).
const GUILLOCHE = [
  'repeating-radial-gradient(circle at 0% 100%, transparent 0 7px, var(--marca-grabado) 7px 8px)',
  'repeating-radial-gradient(circle at 100% 0%, transparent 0 9px, var(--marca-grabado) 9px 10px)',
].join(', ');

const ENLACE_BOTON =
  'inline-flex min-h-11 items-center justify-center rounded-control bg-accion px-5 text-base font-semibold text-texto-sobre-accion hover:bg-accion-hover active:bg-accion-presionada focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';
const ENLACE_BOTON_ANCHO =
  'inline-flex min-h-13 w-full items-center justify-center rounded-control bg-accion px-5 text-base font-bold text-texto-sobre-accion hover:bg-accion-hover active:bg-accion-presionada focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco';

function Estado({ lpa, lpaNegativo }: Pick<ResumenListoParaAsignarProps, 'lpa' | 'lpaNegativo'>) {
  if (lpaNegativo) {
    return (
      <IndicadorEstado estado="problema" etiqueta={dominio.billete.asignasteDeMas} sobreMarca />
    );
  }
  if (lpa === 0) {
    return <IndicadorEstado estado="cero" etiqueta={dominio.billete.todoAsignado} sobreMarca />;
  }
  return null;
}

function EnCamino({ enCamino }: { readonly enCamino: Centavos }) {
  if (enCamino <= 0) return null;
  return (
    <p data-en-camino className="flex items-center gap-1.5 text-cuerpo-pequeno">
      <Icono nombre="informacion" tamano={16} />
      <span>
        {dominio.billete.enCamino} <span aria-hidden="true">{formatearMonto(enCamino)}</span>
        <span className="sr-only">{formatearMontoAccesible(enCamino)}</span>
      </span>
    </p>
  );
}

function Decoracion() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -inset-6 animate-[finn-guilloche_40s_linear_infinite_alternate]"
        style={{ backgroundImage: GUILLOCHE }}
      />
      <div className="absolute inset-y-0 left-0 w-1/5 animate-[finn-brillo_7s_linear_infinite] bg-linear-to-r from-transparent via-texto-sobre-marca/10 to-transparent" />
    </div>
  );
}

export function ResumenListoParaAsignar({
  lpa,
  enCamino,
  lpaNegativo,
  variante,
  accion,
}: ResumenListoParaAsignarProps) {
  const boton =
    accion === undefined ? null : (
      <EnlaceFinn
        href={accion.href}
        className={variante === 'billete' ? ENLACE_BOTON_ANCHO : ENLACE_BOTON}
      >
        {accion.texto}
      </EnlaceFinn>
    );
  if (variante === 'franja') {
    return (
      <section
        data-resumen-lpa="franja"
        aria-label={dominio.billete.rotulo}
        className="relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-contenedor bg-marca px-3.5 py-3 text-texto-sobre-marca"
      >
        <Decoracion />
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-rotulo">{dominio.billete.rotulo}</p>
          <CifrasBillete centavos={lpa} grande={false} />
          <Estado lpa={lpa} lpaNegativo={lpaNegativo} />
          <EnCamino enCamino={enCamino} />
        </div>
        {boton === null ? null : <div className="relative z-10 shrink-0">{boton}</div>}
      </section>
    );
  }
  return (
    <section
      data-resumen-lpa="billete"
      aria-label={dominio.billete.rotulo}
      className="flex flex-col gap-3"
    >
      <div className="relative">
        {/* El resplandor azul queda debajo de la tarjeta (export, S1): dentro de ella teñía el guilloché, sobre todo en oscuro. */}
        <span
          aria-hidden="true"
          data-resplandor
          className="pointer-events-none absolute inset-x-[12%] -bottom-3.5 h-10 animate-[finn-resplandor_6s_ease-in-out_infinite] rounded-full bg-accion/45 blur-[22px]"
        />
        <div
          data-tarjeta-billete
          className="relative isolate flex flex-col gap-2 overflow-hidden rounded-contenedor bg-marca px-5 pt-5.5 pb-5 text-texto-sobre-marca"
        >
          <Decoracion />
          <p className="relative z-10 text-rotulo">{dominio.billete.rotulo}</p>
          <div className="relative z-10">
            <CifrasBillete centavos={lpa} grande />
          </div>
          <div className="relative z-10 flex flex-col gap-1.5">
            <Estado lpa={lpa} lpaNegativo={lpaNegativo} />
            <EnCamino enCamino={enCamino} />
          </div>
        </div>
      </div>
      {boton}
    </section>
  );
}

export const Billete = ResumenListoParaAsignar;
