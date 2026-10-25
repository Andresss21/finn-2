-- finn:manual
-- Formatos del BAC reescritos; F-2 y F-3 inactivos (TA-181; DT-12, 08 §6.1; 04 §8.5 QC-3, RS-03).
-- F-1 se reescribe desde las muestras anonimizadas de TU-13 (packages/sms/pruebas/muestras/bac.txt)
-- para pasar la política de patrones (BE-46): el comercio deja de ser `.+?` entre `\s+` y pasa a
-- palabras separadas por espacios, y el monto admite solo hasta dos decimales. Se conservan las
-- variantes de 03 §9.5 (MASTERCARD o VISA, `:?`, AAAA/MM/DD o AAAAMMDD); fechas y separadores, igual.
-- Las muestras del BAC no traen otros tipos de movimiento (la transferencia no es ninguno de los
-- cuatro tipos), así que no se agregan filas. F-2 y F-3 no tienen muestras: se desactivan, no se
-- eliminan (DB-17).
SELECT finn.tomar_bloqueo();

UPDATE finn.formatos_bancarios
SET patron = '(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>\d[\d,]*(?:\.\d{1,2})?)\s+en el comercio:?\s+(?<comercio>\S+(?:\s+\S+)*?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})(?!\S)'
WHERE nombre = 'BAC compra';

UPDATE finn.formatos_bancarios
SET activo = false
WHERE nombre IN ('Banco Agrícola compra', 'Cuscatlán compra');
