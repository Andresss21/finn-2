// Lector de `/programadas/nueva` y `/programadas/[programadaId]` (05 §2, §4.1): llama a `formulario({ operacion: 'programada', programadaId? })`
// y, al editar, a `programadas()` por `puedeEliminar` (OP-51). Con `calendarioEditable = false` pasa el motivo de `calendario_con_historial`.
// Lo único que traduce los errores de las consultas es `consultar()` (CP-13).
import { programadas as consultaProgramadas } from '@finn/aplicacion/consultas/programadas';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { mensajeDeRechazo } from '@finn/aplicacion/errores';
import type { Centavos } from '@finn/dominio/valores';
import { centavosATextoDecimal } from '../../formato';
import { eliminarProgramada, gestionarProgramada } from '../../servidor/acciones/programadas';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { programadas as t } from '../../textos/programadas';
import { FormularioProgramada } from './formulario';
import { Activar } from './activar';
import type { Campos } from './campos';

const texto = (c: number): string => centavosATextoDecimal(c as Centavos);

export async function LectorProgramada({ programadaId }: { readonly programadaId?: string }) {
  const dto = await consultar(
    async () =>
      formulario(await depsDeConsulta(), {
        operacion: 'programada',
        ...(programadaId === undefined ? {} : { programadaId }),
      }),
    { validacionDeSegmento: true },
  );
  const puedeEliminar =
    programadaId === undefined
      ? false
      : (
          await consultar(async () => consultaProgramadas(await depsDeConsulta()), {
            validacionDeSegmento: true,
          })
        ).programadas.some((x) => x.id === programadaId && x.puedeEliminar);
  const c = dto.contexto;
  const p = 'programada' in c ? c.programada : undefined;
  const cuentas = dto.catalogos.cuentas;
  const refs = (xs: readonly { readonly cuenta: { id: string; nombre: string } }[] | undefined) =>
    (xs ?? []).map((x) => ({ id: x.cuenta.id, nombre: x.cuenta.nombre }));
  const efectivo = refs(cuentas?.efectivo);
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  const inicial: Campos =
    p === undefined
      ? {
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
        }
      : {
          tipo: p.tipo,
          cuentaId: p.cuentaId,
          cuentaDestinoId: p.cuentaDestinoId ?? '',
          comercio: p.comercio,
          monto: texto(p.monto),
          tolerancia: texto(p.tolerancia),
          frecuencia: p.frecuencia,
          frecuenciaDias: p.frecuenciaDias === null ? '' : String(p.frecuenciaDias),
          primeraFecha: p.primeraFecha,
          fechaFin: p.fechaFin ?? '',
          registroAutomatico: p.registroAutomatico,
          lineas: p.lineas.map((l) => ({ monto: texto(l.monto), categoriaId: l.categoriaId })),
        };
  return (
    <FormularioProgramada
      {...(programadaId === undefined || p === undefined
        ? {}
        : {
            programadaId,
            nombre: p.programada.nombre,
            activar: (
              <Activar
                programadaId={programadaId}
                nombre={p.programada.nombre}
                activa={p.activa}
                accion={gestionarProgramada}
              />
            ),
          })}
      inicial={inicial}
      origenes={{ gasto: [...efectivo, ...refs(cuentas?.tarjetas)], otros: efectivo }}
      destinos={{
        pago_tarjeta: refs(cuentas?.tarjetas),
        cuota_prestamo: refs(cuentas?.prestamos),
        aporte_inversion: refs(cuentas?.inversiones),
      }}
      categorias={categorias}
      calendarioEditable={p?.calendarioEditable ?? true}
      motivoCalendario={mensajeDeRechazo({ codigo: 'calendario_con_historial' }) ?? t.sinCambios}
      puedeEliminar={puedeEliminar}
      accion={gestionarProgramada}
      accionEliminar={eliminarProgramada}
    />
  );
}
