// OP-41 Reglas de comercio (04 §3.6): crear (creación, 4.6.1), editar (valor absoluto, 4.6.2) y eliminar (eliminación,
// 4.6.3; `reglas_comercio` es [H], así que una regla que no está es `no_encontrado`). El patrón repetido sin
// mayúsculas lo rechaza el dominio con `reglas` leídas bajo el bloqueo (7.4).
import { leerReglasComercio } from '@finn/db';
import type { ReglaComercio } from '@finn/dominio';
import { CAMPOS_OP41, op41, type EntradaOp41, type SalidaOp41 } from '../../contratos/bandeja.ts';
import type { DefinicionOperacion } from '../marco.ts';

type Resuelto = { readonly entrada: EntradaOp41; readonly reglas: readonly ReglaComercio[] };

const idDe = (e: EntradaOp41) => (e.accion === 'crear' ? e.id : e.reglaId);

export const OP41: DefinicionOperacion<EntradaOp41, Resuelto, SalidaOp41> = {
  id: 'OP-41',
  contrato: op41,
  idempotencia: 'creacion',
  idPrincipal: idDe,
  async comprobarIdempotencia(tx, e) {
    const previa = (await leerReglasComercio(tx)).find((r) => r.id === idDe(e));
    const salida = { reglaId: idDe(e) };
    if (e.accion === 'crear') {
      if (previa === undefined) return { tipo: 'aplicar' };
      return previa.patron === e.patron && previa.categoriaId === e.categoriaId
        ? { tipo: 'ya_aplicada', salida }
        : { tipo: 'conflicto_id' };
    }
    if (previa === undefined) return { tipo: 'no_encontrado' };
    if (e.accion === 'eliminar') return { tipo: 'aplicar' };
    const claves = CAMPOS_OP41.filter((k) => e[k] !== undefined);
    if (claves.every((k) => previa[k] === e[k])) return { tipo: 'ya_aplicada', salida };
    if (claves.every((k) => previa[k] === e.esperado[k])) return { tipo: 'aplicar' };
    return {
      tipo: 'conflicto_desactualizado',
      actuales: Object.fromEntries(claves.map((k) => [k, previa[k]])),
    };
  },
  async resolver(tx, e) {
    return { entrada: e, reglas: await leerReglasComercio(tx) };
  },
  comando: ({ entrada: e, reglas }) => {
    const base = { operacion: 'OP-41', reglas } as const;
    if (e.accion === 'crear')
      return { ...base, accion: 'crear', id: e.id, patron: e.patron, categoriaId: e.categoriaId };
    if (e.accion === 'eliminar') return { ...base, accion: 'eliminar', reglaId: e.reglaId };
    return {
      ...base,
      accion: 'editar',
      reglaId: e.reglaId,
      ...(e.patron === undefined ? {} : { patron: e.patron }),
      ...(e.categoriaId === undefined ? {} : { categoriaId: e.categoriaId }),
    };
  },
  salida: (_resultado, { entrada }) => ({ reglaId: idDe(entrada) }),
};
