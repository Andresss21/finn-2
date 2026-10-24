'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { asignar } from '@/lib/acciones';
import { useOperacion } from './use-operacion';

export function FormAsignar({ asignadoEsperado, enSuperpuesto }: { asignadoEsperado: number; enSuperpuesto?: boolean }) {
  const router = useRouter();
  const [esperado] = useState(asignadoEsperado);      // instantánea al abrir (FE-08)
  const [monto, setMonto] = useState('');
  const [demora, setDemora] = useState(0);
  const op = useOperacion(asignar);
  const entrada = { montoNuevo: Number(monto), esperado, demoraMs: demora };
  const enviar = async (confirmar = false) => {
    const r = await op.enviar(entrada, confirmar);
    if (r?.ok && enSuperpuesto) router.back();
  };
  return (
    <form data-testid="form-asignar" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
      <label>Monto nuevo <input name="monto" value={monto} onChange={(e) => setMonto(e.target.value)} /></label>
      <label>Demora <input name="demora" value={demora} onChange={(e) => setDemora(Number(e.target.value))} /></label>
      <span data-testid="esperado">{esperado}</span>
      <button type="submit" disabled={op.estado.fase === 'enviando'}>Asignar</button>
      {op.estado.fase === 'confirmando' && (
        <div role="alertdialog" aria-label="Confirmar">
          <p data-testid="prev">{op.estado.cambio ? 'El impacto cambió. ' : ''}deltaLpa {op.estado.previsualizacion.impacto.deltaLpa}</p>
          <button type="button" onClick={() => enviar(true)}>Confirmar</button>
        </div>
      )}
      <output data-testid="fase">{op.estado.fase}{op.estado.fase === 'error' ? `:${op.estado.error.codigo}` : ''}{op.estado.fase === 'listo' && op.estado.yaAplicada ? ':ya' : ''}</output>
    </form>
  );
}
