# Muestra para la verificación independiente

Cada fila: id de captura, ruta de la app y la referencia de diseño (sin la variante). Capturas de la app: `docs/auditoria-diseno/capturas/<id>__<variante>.png` (y `capturas/pliegue/` = lo que se ve al abrir, sin desplazar). Referencia: `<referencia>__<variante>.png` y `.html`. Variantes: `telefono-claro`, `telefono-oscuro`, `computadora-claro`.

| # | id de captura | ruta | referencia |
|---|---|---|---|
| 1 | `acceso__ingresar` | `/ingresar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/ingresar` |
| 2 | `acceso__credenciales-invalidas` | `/ingresar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/credenciales-invalidas` |
| 3 | `acceso__demasiados-intentos` | `/ingresar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/demasiados-intentos` |
| 4 | `acceso__verificar-vacio` | `/ingresar/verificar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/verificar` |
| 5 | `acceso__codigo-incorrecto` | `/ingresar/verificar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/codigo-incorrecto` |
| 6 | `acceso__codigo-vencido` | `/ingresar/verificar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/codigo-vencido` |
| 7 | `acceso__verificar-varios-factores` | `/ingresar/verificar` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/verificar-varios-factores` |
| 8 | `acceso__inscribir` | `/ingresar/inscribir` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/inscribir` |
| 9 | `acceso__inscribir-cierre` | `/ingresar/inscribir` | `docs/diseno/02-referencias/entrega-2/pantallas/13-acceso/inscribir-cierre` |
| 10 | `ajustes__indice` | `/ajustes` | `docs/diseno/entrega-3/pantallas/16-salir/ajustes-indice` |
| 11 | `ajustes-seguridad__dos-factores` | `/ajustes/seguridad` | `docs/diseno/entrega-3/pantallas/16-salir/seguridad` |
| 12 | `ajustes-seguridad__un-factor` | `/ajustes/seguridad` | `docs/diseno/entrega-3/pantallas/16-salir/seguridad-factor-unico` |
| 13 | `ajustes-ciclo__aviso` | `/ajustes/ciclo` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/ciclo` |
| 14 | `ajustes-conectar-sms__con-token` | `/ajustes/webhook` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/conectar-sms` |
| 15 | `ajustes-formatos__lista` | `/ajustes/formatos` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/formatos` |
| 16 | `ajustes-notificaciones__concedido` | `/ajustes/notificaciones` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/notificaciones` |
| 17 | `ajustes-exportar__principal` | `/ajustes/exportar` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/exportar` |
| 18 | `ajustes-respaldo__atrasado` | `/ajustes/respaldo` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/respaldo` |
| 19 | `ajustes-diagnostico__con-referencia` | `/ajustes/diagnostico` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/diagnostico` |
| 20 | `ajustes-apariencia__sistema` | `/ajustes/apariencia` | `docs/diseno/02-referencias/entrega-2/pantallas/11-ajustes/apariencia` |
| 21 | `marco__mas-secciones-abierta` | `(hoja Más secciones)` | `docs/diseno/entrega-3/pantallas/16-salir/mas-secciones` |
| 22 | `registrar-gasto__principal` | `/registrar/gasto` | `docs/diseno/02-referencias/entrega-1/pantallas/S5-Registrar` |
| 23 | `registrar-gasto__suma-distinta-del-total` | `/registrar/gasto` | `docs/diseno/02-referencias/entrega-1/pantallas/S5-Registrar__suma-distinta-del-total` |
| 24 | `revisar__listo` | `/bandeja/[movimientoId]` | `docs/diseno/02-referencias/entrega-2/pantallas/01-revisar-movimiento/listo` |
| 25 | `asignar__principal` | `/presupuesto/asignar/[categoriaId]` | `docs/diseno/02-referencias/entrega-2/pantallas/07-flujos-del-presupuesto/asignar` |
| 26 | `cuenta-nueva__tarjeta` | `/cuentas/nueva` | `docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/nueva-tarjeta` |
| 27 | `cuenta-pagar__principal` | `/cuentas/[cuentaId]/pagar` | `docs/diseno/02-referencias/entrega-2/pantallas/06-detalle-de-cuenta/pagar-tarjeta` |
| 28 | `transaccion-editar__principal` | `/actividad/[transaccionId]/editar` | `docs/diseno/02-referencias/entrega-2/pantallas/03-detalle-de-transaccion/editar` |
| 29 | `meta__nueva-mensual` | `/metas/nueva` | `docs/diseno/02-referencias/entrega-2/pantallas/09a-metas/nueva` |
| 30 | `categoria-archivar__formulario` | `/presupuesto/categorias/[categoriaId]/archivar` | `docs/diseno/02-referencias/entrega-2/pantallas/07-flujos-del-presupuesto/archivar-categoria` |

Referencias de la entrega 1 (`02-referencias/entrega-1/pantallas/S5-…`): el HTML está en esa carpeta; el PNG está en `docs/diseno/02-referencias/entrega-1/referencia/` con el mismo nombre. Los estados (`S5-Registrar__suma-distinta-del-total`) existen solo en teléfono claro, como `.png` y `.html` sin variante.
