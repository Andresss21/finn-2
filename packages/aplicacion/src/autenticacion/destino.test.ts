// FE-36 (05 §9.2) y `volver` (05 §3.6): cada celda de la tabla.
import { describe, expect, it } from 'vitest';
import { destinoAcceso, type EstadoParaDestino, type RutaAcceso } from './destino.ts';

const NINGUNA: EstadoParaDestino = {
  sesion: 'ninguna',
  usuarioPermitido: false,
  factoresVerificados: [],
};
const OTRO: EstadoParaDestino = {
  sesion: 'aal1',
  usuarioPermitido: false,
  factoresVerificados: [],
};
const CON_FACTOR: EstadoParaDestino = {
  sesion: 'aal1',
  usuarioPermitido: true,
  factoresVerificados: [{ id: 'f' }],
};
const SIN_FACTOR: EstadoParaDestino = {
  sesion: 'aal1',
  usuarioPermitido: true,
  factoresVerificados: [],
};
const AAL2: EstadoParaDestino = {
  sesion: 'aal2',
  usuarioPermitido: true,
  factoresVerificados: [{ id: 'f' }],
};

const INGRESAR: RutaAcceso = '/ingresar';
const VERIFICAR: RutaAcceso = '/ingresar/verificar';
const INSCRIBIR: RutaAcceso = '/ingresar/inscribir';
const VOLVER = '/presupuesto?periodo=2026-09-21';
const SUFIJO = `?volver=${encodeURIComponent(VOLVER)}`;

const mostrar = (cerrarSesion = false) => ({ accion: 'mostrar', cerrarSesion });
const ir = (destino: string, cerrarSesion = false) => ({
  accion: 'redirigir',
  destino,
  cerrarSesion,
});

describe('PRU-SEG-ACCESO', () => {
  it('PRU-SEG-ACCESO-103 FE-36: la tabla de 05 §9.2, celda por celda, conserva volver y lo sanea como en 05 §3.6', () => {
    const tabla: [EstadoParaDestino, RutaAcceso, unknown][] = [
      [NINGUNA, INGRESAR, mostrar()],
      [NINGUNA, VERIFICAR, ir(INGRESAR + SUFIJO)],
      [NINGUNA, INSCRIBIR, ir(INGRESAR + SUFIJO)],
      [OTRO, INGRESAR, mostrar(true)],
      [OTRO, VERIFICAR, ir(INGRESAR + SUFIJO, true)],
      [OTRO, INSCRIBIR, ir(INGRESAR + SUFIJO, true)],
      [CON_FACTOR, INGRESAR, ir(VERIFICAR + SUFIJO)],
      [CON_FACTOR, VERIFICAR, mostrar()],
      [CON_FACTOR, INSCRIBIR, ir(VERIFICAR + SUFIJO)],
      [SIN_FACTOR, INGRESAR, ir(INSCRIBIR + SUFIJO)],
      [SIN_FACTOR, VERIFICAR, ir(INSCRIBIR + SUFIJO)],
      [SIN_FACTOR, INSCRIBIR, mostrar()],
      [AAL2, INGRESAR, ir(VOLVER)],
      [AAL2, VERIFICAR, ir(VOLVER)],
      [AAL2, INSCRIBIR, ir(VOLVER)],
    ];
    for (const [estado, ruta, esperado] of tabla)
      expect(destinoAcceso(estado, ruta, VOLVER), `${JSON.stringify(estado)} ${ruta}`).toEqual(
        esperado,
      );

    // AAL2 de otro usuario: sigue siendo "cerrar", nunca `volver` (que lo traería de vuelta).
    expect(destinoAcceso({ ...AAL2, usuarioPermitido: false }, VERIFICAR, null)).toEqual(
      ir(INGRESAR, true),
    );
    // Sin `volver`, sin parámetro; con AAL2, `/`.
    expect(destinoAcceso(CON_FACTOR, INGRESAR, null)).toEqual(ir(VERIFICAR));
    expect(destinoAcceso(AAL2, INGRESAR, null)).toEqual(ir('/'));
    // Una ruta externa nunca es destino ni se propaga.
    for (const externa of ['//evil.example/x', '/\\evil.example', 'https://evil.example', '']) {
      expect(destinoAcceso(AAL2, INGRESAR, externa)).toEqual(ir('/'));
      expect(destinoAcceso(NINGUNA, VERIFICAR, externa)).toEqual(ir(`${INGRESAR}?volver=%2F`));
    }
  });
});
