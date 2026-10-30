# Recursos de marca de Finn (05 §10.11)

**Estado: recursos de la marca, no provisionales.** Portados de `finn-marca.zip` (A.9, en `docs/anexos/finn-marca/`).
El detalle del dibujo y los colores fijos de los íconos (`marca-icono-fondo`, `marca-icono-figura`) están en el
`LEEME.md` de ese anexo y en `tokens.json`.

| Archivo aquí | Origen en `finn-marca` | Uso |
|---|---|---|
| `simbolo.svg` | `finn-simbolo.svg` | Ingreso, `/sin-conexion` |
| `logotipo.svg` | `finn-logotipo.svg` | Ingreso |
| `icono-192.png`, `icono-512.png` | `icon-192.png`, `icon-512.png` | Manifiesto, `purpose: any` |
| `icono-maskable-512.png` | `icon-adaptable-512.png` | Manifiesto, `purpose: maskable` |
| `apple-touch-icon.png` | `apple-touch-icon-180.png` | `metadata.icons.apple` |
| `insignia-96.png` | `insignia-96.png` | `badge` de las notificaciones push |

El favicon va en `apps/web/src/app/icon.svg` (de `favicon.svg`) y `apps/web/src/app/favicon.ico`.
Para reemplazarlos, se cambian los archivos con los mismos nombres; no se toca código.
