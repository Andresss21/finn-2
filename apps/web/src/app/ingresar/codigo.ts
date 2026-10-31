// Código TOTP (05 §9.4): al pegar "123 456" o "123-456" se quitan los espacios y los guiones.
export const normalizarCodigo = (texto: string): string => texto.replace(/[\s-]/g, '');
