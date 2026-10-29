// `formulario({ operacion: 'cuenta', cuentaId?, tipo? })` (04 §6.14.4): crear (instituciones [M], nombres de tarjeta
// usados, modelos de préstamo) o editar (además, los campos con `esperado` y `fechaAperturaMaxima`).
import { formulario } from '@finn/dominio/selectores';
import { leerInstituciones } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'cuenta' }>;

export async function cuenta({ tx, i }: ContextoConsulta, p: P) {
  if (p.cuentaId !== undefined && !i.hechos.cuentas.some((k) => k.id === p.cuentaId))
    throw noEncontrado();
  return formulario(
    i,
    { operacion: 'cuenta', ...sinIndefinidos({ cuentaId: p.cuentaId, tipo: p.tipo }) },
    { instituciones: await leerInstituciones(tx) },
  );
}
