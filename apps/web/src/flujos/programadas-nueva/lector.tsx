// Lector de `/programadas/nueva` (05 §2, §4.1): llama a `formulario({ operacion: 'programada' })` para los catálogos y el `hoy` del servidor.
// Lo único que traduce los errores de las consultas es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { gestionarProgramada } from '../../servidor/acciones/programadas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioProgramada } from './formulario';

export async function LectorProgramada() {
  const dto = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'programada' }),
    { validacionDeSegmento: true },
  );
  const cuentas = [...(dto.catalogos.cuentas?.efectivo ?? []), ...(dto.catalogos.cuentas?.tarjetas ?? [])].map(
    (x) => ({ id: x.cuenta.id, nombre: x.cuenta.nombre }),
  );
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  return (
    <FormularioProgramada
      inicial={{
        cuentaId: '',
        comercio: '',
        monto: '',
        tolerancia: '',
        categoriaId: '',
        frecuencia: 'mensual',
        frecuenciaDias: '',
        primeraFecha: dto.hoy,
        fechaFin: '',
        registroAutomatico: false,
      }}
      cuentas={cuentas}
      categorias={categorias}
      accion={gestionarProgramada}
    />
  );
}
