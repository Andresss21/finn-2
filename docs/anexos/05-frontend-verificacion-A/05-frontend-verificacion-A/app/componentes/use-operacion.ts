'use client';
// Prototipo de useOperacion (05 §4, FE-06 a FE-11).
import { useRef, useState } from 'react';
import type { ResultadoAccion, Previsualizacion, ErrorFinn } from '@/lib/tipos';

export type Fase =
  | { fase: 'editando' } | { fase: 'enviando' }
  | { fase: 'confirmando'; previsualizacion: Previsualizacion; cambio: boolean }
  | { fase: 'listo'; yaAplicada: boolean } | { fase: 'error'; error: ErrorFinn };

const esDesfaseDeVersion = (e: unknown) =>
  e instanceof Error && /Server Action .* was not found|failed-to-find-server-action/i.test(e.message);

export function useOperacion<E extends object, T>(
  accion: (e: E & { revisionVista?: string; huellaImpacto?: string }) => Promise<ResultadoAccion<T>>,
  opciones: { esperaOcupadoMs?: number } = {},
) {
  const [estado, setEstado] = useState<Fase>({ fase: 'editando' });
  const enVuelo = useRef(false);
  const ultimaPrev = useRef<Previsualizacion | null>(null);
  const [intentos, setIntentos] = useState(0);

  async function llamar(entrada: E, prev: Previsualizacion | null): Promise<ResultadoAccion<T>> {
    setIntentos((n) => n + 1);
    try {
      return await accion({ ...entrada, ...(prev ? { revisionVista: prev.revisionVista, huellaImpacto: prev.huellaImpacto } : {}) });
    } catch (e) {
      if (esDesfaseDeVersion(e)) return { ok: false, error: { categoria: 'INTERNO', codigo: 'version_nueva', mensaje: 'Hay una versión nueva' } };
      return { ok: false, error: { categoria: 'INCIERTO', codigo: 'red', mensaje: String(e) } };
    }
  }

  async function enviar(entrada: E, confirmar = false) {
    if (enVuelo.current) return;                  // doble envío: se ignora
    enVuelo.current = true;
    setEstado({ fase: 'enviando' });
    try {
      const prev = confirmar ? ultimaPrev.current : null;
      let r = await llamar(entrada, prev);
      if (!r.ok && (r.error.categoria === 'OCUPADO' || r.error.categoria === 'INCIERTO')) {
        if (r.error.categoria === 'OCUPADO') await new Promise((s) => setTimeout(s, opciones.esperaOcupadoMs ?? 1200));
        r = await llamar(entrada, prev);           // reintento único, misma entrada
      }
      if (r.ok) { ultimaPrev.current = null; setEstado({ fase: 'listo', yaAplicada: r.yaAplicada }); return r; }
      if (r.error.categoria === 'REQUIERE_CONFIRMACION' && r.error.previsualizacion) {
        const cambio = !!prev;                     // pidió confirmar con huella y el impacto cambió
        ultimaPrev.current = r.error.previsualizacion;
        setEstado({ fase: 'confirmando', previsualizacion: r.error.previsualizacion, cambio });
        return r;
      }
      setEstado({ fase: 'error', error: r.error });
      return r;
    } finally { enVuelo.current = false; }
  }
  return { estado, enviar, intentos, reiniciar: () => setEstado({ fase: 'editando' }) };
}
