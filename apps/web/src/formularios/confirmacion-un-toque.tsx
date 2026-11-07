'use client';
// La confirmación de las acciones de un toque que el servidor frena con un aviso "antes" (05 §4.4, §4.14 regla 5; AV-11 de OP-14
// cuando dejaría Listo para asignar en negativo). Sale de `useUnToque`: con `estado === 'confirmando'` dice el aviso con el monto que
// trajo el servidor (PF-3: acá solo se le da formato) y ofrece «Confirmar» (misma entrada más la huella) o «Cancelar». Nunca
// confirma sola. La usan ritmo, realidad, tarjetas y flujo de efectivo, que comparten la forma.
import { AvisoEnLinea } from '../componentes/base/aviso';
import { Boton } from '../componentes/base/boton';
import { formatearMonto } from '../formato';
import { formularios } from '../textos/formularios';
import { presupuestoAsignar } from '../textos/presupuesto-asignar';
import type { useUnToque } from './use-un-toque';

type UnToque = ReturnType<typeof useUnToque>;
type Monto = Parameters<typeof formatearMonto>[0];
interface Vista {
  readonly avisos?: readonly {
    readonly codigo: string;
    readonly datos?: { readonly lpa?: Monto };
  }[];
}

export function ConfirmacionUnToque({
  un,
}: {
  readonly un: Pick<
    UnToque,
    'estado' | 'previsualizacion' | 'impactoCambio' | 'confirmar' | 'volverAEditar'
  >;
}) {
  if (un.estado !== 'confirmando') return null;
  const avisos = ((un.previsualizacion ?? {}) as Vista).avisos ?? [];
  const textos = avisos.flatMap((a) =>
    a.codigo === 'AV-11' && a.datos?.lpa !== undefined
      ? [presupuestoAsignar.avisos['AV-11'](formatearMonto(a.datos.lpa))]
      : [],
  );
  return (
    <div data-confirmacion-un-toque>
      <AvisoEnLinea
        estado="advertencia"
        aparecioDespues
        titulo={un.impactoCambio ? formularios.impactoCambio : presupuestoAsignar.revisar}
        accion={
          <span className="flex flex-wrap gap-2">
            <Boton variante="secundaria" onClick={un.volverAEditar}>
              {formularios.cancelar}
            </Boton>
            <Boton onClick={() => void un.confirmar()}>{presupuestoAsignar.confirmar}</Boton>
          </span>
        }
      >
        {textos.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </AvisoEnLinea>
    </div>
  );
}
