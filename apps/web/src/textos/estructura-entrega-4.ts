// Textos que la entrega 4 agrega a Estructura (E4-6 y E4-31, OP-10): la sección «Archivadas · N» y su resultado en el lugar.
// Voseo (05 §12.2). Los rechazos del servidor llegan compuestos en `mensaje`.
export const estructuraEntrega4 = {
  archivadas: (n: number) => `Archivadas · ${n}`,
  /** La categoría archivada: el grupo al que volvería. La fecha de archivo no viene en `estructura()` (04 §6.12.4). */
  deGrupo: (grupo: string) => `${grupo} · archivada`,
  deGrupoArchivado: (grupo: string) => `${grupo} · grupo archivado`,
  grupoEstaArchivado: (grupo: string) => `${grupo} está archivado.`,
  desarchivar: 'Desarchivar',
  desarchivando: 'Desarchivando…',
  desarchivarTambien: (grupo: string) => `Desarchivar también ${grupo}`,
  desarchivaste: (categoria: string, grupo: string) =>
    `Desarchivaste ${categoria}: volvió a ${grupo}.`,
  desarchivasteConGrupo: (categoria: string, grupo: string) =>
    `Desarchivaste ${categoria} y el grupo ${grupo}.`,
  archivarDeNuevo: 'Archivarla de nuevo',
} as const;
