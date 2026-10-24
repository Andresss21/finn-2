'use client';
// Prototipo de useLecturaInteractiva (CP-3, FE-13): espera de 300 ms, mínimo 2 caracteres,
// a lo sumo una petición en vuelo y descarte de respuestas viejas.
import { useEffect, useRef, useState } from 'react';
import { sugerir } from '@/lib/acciones';

export function Sugerencia() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState('');
  const secuencia = useRef(0);
  const enVuelo = useRef(false);
  const pendiente = useRef<string | null>(null);
  async function pedir(t: string) {
    if (enVuelo.current) { pendiente.current = t; return; }
    enVuelo.current = true;
    const mia = ++secuencia.current;
    const r = await sugerir({ comercio: t, demoraMs: t.length === 2 ? 900 : 100 });
    enVuelo.current = false;
    if (mia === secuencia.current && r.ok && t === textoActual.current) setResultado(r.valor.para);
    const sig = pendiente.current; pendiente.current = null;
    if (sig !== null && sig !== t) pedir(sig);
  }
  const textoActual = useRef('');
  useEffect(() => {
    textoActual.current = texto;
    if (texto.trim().length < 2) { setResultado(''); return; }
    const h = setTimeout(() => pedir(texto), 300);
    return () => clearTimeout(h);
  }, [texto]);
  return (<div><input aria-label="Comercio" value={texto} onChange={(e) => setTexto(e.target.value)} />
    <output data-testid="sugerencia">{resultado}</output></div>);
}
