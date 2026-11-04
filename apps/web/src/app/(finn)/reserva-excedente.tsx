'use client';
// Propuesta de AV-08 de un toque en Inicio (05 §0.9 CP-8, §4.14, FE-24): OP-14 sobre pago(t) con `montoNuevo` y `esperado` que
// armó el selector (Asig − RE y Asig); acá solo se escriben como texto (PF-3). Con `ok: true` ofrece «Deshacer»: OP-14 con los dos
// valores intercambiados. Como la revalidación hace desaparecer la fila (RE llega a 0), la salida queda en su lugar (regla 4).
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import { useCallback, useEffect, useRef } from 'react';
import { AvisoEnLinea } from '../../componentes/base/aviso';
import { Boton } from '../../componentes/base/boton';
import { Monto } from '../../componentes/dominio/monto';
import { centavosATextoDecimal, formatearMonto } from '../../formato';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { useUnToque } from '../../formularios/use-un-toque';
import { inicio as t } from '../../textos/inicio';

type Fila = InicioDto['atencion']['reservaExcedente'][number];
interface Entrada {
  readonly categoriaId: string;
  readonly periodoInicio: string;
  readonly montoNuevo: string;
  readonly esperado: { readonly monto: string };
}

export function ReservaExcedente({
  filas,
  accion: accionDelLector,
}: {
  readonly filas: readonly Fila[];
  /** `asignarEnCategoria` (OP-14): la pone el lector, así la pantalla se prueba sin servidor. */
  readonly accion: AccionEscritura;
}) {
  const tocada = useRef<Fila | null>(null);
  // Tras revalidar, la Server Action llega con otra identidad; `useUnToque` rearma su salida si la acción cambia, y «Deshacer»
  // volvería a aparecer después de usarlo. Una función estable que llama a la última evita ese rearmado.
  const ultima = useRef(accionDelLector);
  useEffect(() => {
    ultima.current = accionDelLector;
  }, [accionDelLector]);
  const accion = useCallback<AccionEscritura>((entrada) => ultima.current(entrada), []);
  const un = useUnToque({
    accion,
    accionInversa: accion,
    inversa: (entrada) => {
      const e = entrada as Entrada;
      const f = tocada.current;
      if (f === null) return null;
      return {
        descripcion: t.reservaDevuelta(f.tarjeta.nombre, formatearMonto(f.monto)),
        etiqueta: t.deshacer,
        entrada: { ...e, montoNuevo: e.esperado.monto, esperado: { monto: e.montoNuevo } },
      };
    },
  });
  const ocupado = un.estado === 'enviando' || un.revertir.estado === 'enviando';
  const fallo = un.error ?? un.revertir.error;
  return (
    <>
      {filas.map((f) => (
        <div key={f.tarjeta.id} data-reserva-excedente={f.tarjeta.id}>
          <AvisoEnLinea
            estado="informacion"
            accion={
              <Boton
                variante="secundaria"
                enviando={un.estado === 'enviando'}
                deshabilitado={ocupado}
                textoEnviando={t.devolviendo}
                onClick={() => {
                  tocada.current = f;
                  const entrada: Entrada = {
                    categoriaId: f.categoriaPagoId,
                    periodoInicio: f.periodoInicio,
                    montoNuevo: centavosATextoDecimal(f.montoNuevo),
                    esperado: { monto: centavosATextoDecimal(f.asignado) },
                  };
                  void un.tocar(entrada);
                }}
              >
                {t.devolverReserva(formatearMonto(f.monto))}
              </Boton>
            }
          >
            {f.tarjeta.nombre}: <Monto centavos={f.monto} rol="cifra" /> {t.reservadoDeMas}
          </AvisoEnLinea>
        </div>
      ))}
      {un.salida === null ? null : (
        <div data-reserva-devuelta>
          <AvisoEnLinea
            estado="positivo"
            aparecioDespues
            accion={
              <Boton variante="discreta" deshabilitado={ocupado} onClick={() => void un.deshacer()}>
                {un.salida.etiqueta}
              </Boton>
            }
          >
            {un.salida.descripcion}
          </AvisoEnLinea>
        </div>
      )}
      {fallo === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {fallo.mensaje}
        </AvisoEnLinea>
      )}
    </>
  );
}
