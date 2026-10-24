// Dos componentes de muestra con los requisitos de 05 (PF-2 y formularios): el indicador de sobregiro distingue el tipo
// con color e indicador no cromático con nombre accesible; el campo de monto asocia su error.
import { useId, useState } from 'react';
export function IndicadorSobregiro({ tipo, monto, malo = false }: { tipo: 'debito' | 'tarjeta'; monto: string; malo?: boolean }) {
  const nombre = tipo === 'debito' ? 'sobregiro con débito o efectivo' : 'deuda sin reservar';
  if (malo) return <span style={{ color: '#bbb', background: '#fff' }}><svg width="12" height="12" role="img"><circle cx="6" cy="6" r="5" /></svg> −{monto}</span>; // control negativo
  return (
    <span style={{ color: tipo === 'debito' ? '#8a1c1c' : '#5a3d00', background: '#fff' }}>
      <svg width="12" height="12" role="img" aria-label={nombre}><circle cx="6" cy="6" r="5" /></svg> −{monto}
    </span>
  );
}
export function CampoMonto({ etiqueta }: { etiqueta: string }) {
  const id = useId(); const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ background: '#fff', color: '#111' }}>
      <label htmlFor={id}>{etiqueta}</label>
      <input id={id} inputMode="decimal" aria-invalid={error ? true : undefined} aria-describedby={error ? id + '-e' : undefined}
        onBlur={e => setError(/^\d+([.,]\d{1,2})?$/.test(e.currentTarget.value) ? null : 'Usá el punto o la coma solo para los centavos, sin separador de miles.')} />
      {error && <p id={id + '-e'} role="alert">{error}</p>}
    </div>
  );
}
