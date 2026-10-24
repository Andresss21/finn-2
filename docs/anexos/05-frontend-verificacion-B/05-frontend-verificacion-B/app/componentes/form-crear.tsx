'use client';
import { useRef, useState } from 'react';
import { crear } from '@/lib/acciones';
import { useOperacion } from './use-operacion';

export function FormCrear() {
  const idRef = useRef<string | null>(null);           // FE-07: perezoso, se conserva hasta un éxito
  const [ultimoId, setUltimoId] = useState('');
  const [fallo, setFallo] = useState<'' | 'ocupado' | 'incierto'>('');
  const op = useOperacion(crear, { esperaOcupadoMs: 300 });
  return (
    <form data-testid="form-crear" onSubmit={async (e) => {
      e.preventDefault();
      idRef.current ??= crypto.randomUUID();
      setUltimoId(idRef.current);
      const r = await op.enviar({ id: idRef.current, monto: 1000, ...(fallo ? { fallo } : {}) });
      if (r?.ok) idRef.current = null;
    }}>
      <select name="fallo" value={fallo} onChange={(e) => setFallo(e.target.value as typeof fallo)}>
        <option value="">sin fallo</option><option value="ocupado">ocupado</option><option value="incierto">incierto</option>
      </select>
      <button type="submit">Crear</button>
      <output data-testid="crear-fase">{op.estado.fase}{op.estado.fase === 'listo' && op.estado.yaAplicada ? ':ya' : ''}|{op.intentos}|{ultimoId}</output>
    </form>
  );
}
