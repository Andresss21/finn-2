-- Subconjunto de 03 §3.17 para V-27 (solo las restricciones de sms_recibidos)
DROP TABLE IF EXISTS finn.sms_recibidos;
CREATE TABLE finn.sms_recibidos (
  id uuid PRIMARY KEY,
  texto text NOT NULL,
  remitente text NOT NULL,
  recibido_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_sms_texto     CHECK (char_length(texto) BETWEEN 1 AND 2000),
  CONSTRAINT ck_sms_remitente CHECK (remitente <> '')
);
