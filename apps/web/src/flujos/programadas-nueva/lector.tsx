// Lector de `/programadas/nueva` (05 §2, §4.1): llama a `formulario({ operacion: 'programada' })` para los catálogos y el `hoy` del servidor.
// Lo único que traduce los errores de las consultas es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { gestionarProgramada } from '../../servidor/acciones/programadas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioProgramada } from './formulario';

const refs = (xs: readonly { readonly cuenta: { id: string; nombre: string } }[] | undefined) =>
  (xs ?? []).map((x) => ({ id: x.cuenta.id, nombre: x.cuenta.nombre }));

export async function LectorProgramada() {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'programada' }),
    { validacionDeSegmento: true },
  );
  const cuentas = dto.catalogos.cuentas;
  const efectivo = refs(cuentas?.efectivo);
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  return (
    <FormularioProgramada
      inicial={{
        tipo: 'gasto',
        cuentaId: '',
        cuentaDestinoId: '',
        comercio: '',
        monto: '',
        tolerancia: '',
        frecuencia: 'mensual',
        frecuenciaDias: '',
        primeraFecha: dto.hoy,
        fechaFin: '',
        registroAutomatico: false,
        lineas: [{ monto: '', categoriaId: '' }],
      }}
      origenes={{ gasto: [...efectivo, ...refs(cuentas?.tarjetas)], otros: efectivo }}
      destinos={{
        pago_tarjeta: refs(cuentas?.tarjetas),
        cuota_prestamo: refs(cuentas?.prestamos),
        aporte_inversion: refs(cuentas?.inversiones),
      }}
      categorias={categorias}
      accion={gestionarProgramada}
    />
  );
}
