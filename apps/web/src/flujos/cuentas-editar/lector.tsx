// Lector de `/cuentas/[cuentaId]/editar` (05 §4.1): `formulario({ operacion: 'cuenta', cuentaId })`; `consultar()` traduce los errores.
import type { Centavos } from '@finn/dominio/valores';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { editarCuenta } from '../../servidor/acciones/cuentas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { centavosATextoDecimal } from '../../formato/monto';
import { porcentajeDe } from '../cuentas-condiciones/campos';
import { FormularioCuentasEditar } from './formulario';

/** CTA-01: los datos propios de la tarjeta, como texto de formulario; los días van como número (contrato de OP-02). */
function deTarjeta(cuenta: object): Record<string, string | number | null> {
  const c = cuenta as Record<string, unknown>;
  if (c['tipo'] !== 'tarjeta') return {};
  const tasa = c['tasaAnualMillonesimas'];
  return {
    limiteCredito: centavosATextoDecimal(c['limiteCredito'] as Centavos),
    tasaAnual: typeof tasa === 'number' ? porcentajeDe(tasa) : null,
    diaCorte: c['diaCorte'] as number,
    diaPago: c['diaPago'] as number,
  };
}

export async function LectorCuentasEditar({ cuentaId }: { readonly cuentaId: string }) {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'cuenta', cuentaId }),
    { validacionDeSegmento: true },
  );
  if (!('cuenta' in dto.contexto)) notFound(); // con `cuentaId` siempre viene; el tipo no lo sabe
  const { cuenta } = dto.contexto;
  return (
    <FormularioCuentasEditar
      accion={editarCuenta}
      cuentaId={cuentaId}
      hoy={dto.hoy}
      instituciones={dto.contexto.instituciones}
      esperado={{
        nombre: cuenta.nombre,
        // [CH-224] solo una cuenta de efectivo tiene subtipo; va en `esperado` para OP-02
        ...('subtipoEfectivo' in cuenta ? { subtipoEfectivo: cuenta.subtipoEfectivo } : {}),
        institucionId: cuenta.institucion?.id ?? null,
        ultimos4: cuenta.ultimos4,
        fechaApertura: cuenta.fechaApertura,
        ...deTarjeta(cuenta),
      }}
    />
  );
}
