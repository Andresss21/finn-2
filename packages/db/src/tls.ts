// TLS verificado contra Supabase con su CA (CH-65; 04 §14.2). Sin dependencias: lo importan `cliente.ts` y, por ruta
// relativa, los scripts de `tools/` que se conectan a producción (`pg` vive en @finn/db, ADR-21).
//
// La CA es una constante y no un archivo: en Vercel, el file tracing de Next puede dejar afuera un `.crt` leído con
// `readFileSync` sin ningún error hasta producción; una constante viaja dentro del módulo que la usa. Es pública.
// CN=Supabase Root 2021 CA; vence el 2031-04-26 y hay que renovarla antes (TU-20).
export const CA_SUPABASE = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----
`;

export type ConfigPg = {
  connectionString: string;
  ssl?: { ca: string; rejectUnauthorized: true };
};

const esSupabase = (host: string): boolean => /\.(pooler\.supabase\.com|supabase\.co)$/i.test(host);

/**
 * La configuración de `pg` para `url`. Con un host de Supabase verifica el certificado con su CA.
 * `ConnectionParameters` de pg hace `Object.assign({}, config, parse(connectionString))`, y `pg-connection-string`
 * pone `ssl = {}` si hay `sslmode` (y `ssl`, `sslrootcert`…): lo parseado pisaría nuestro `ssl`. Por eso esos
 * parámetros se quitan de la copia de la URL que recibe `pg`; `pgbouncer` y el resto siguen. Prisma CLI y `pg_dump` no
 * pasan por aquí y conservan `sslmode` (04 §14.2). Con cualquier otro host, o una URL que no se puede leer (el error
 * de `pg` ya la oculta), la URL queda igual.
 */
export function configPg(url: string): ConfigPg {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { connectionString: url };
  }
  if (!esSupabase(u.hostname)) return { connectionString: url };
  for (const p of [...u.searchParams.keys()]) {
    if (/^ssl|^uselibpqcompat$/i.test(p)) u.searchParams.delete(p);
  }
  return { connectionString: u.href, ssl: { ca: CA_SUPABASE, rejectUnauthorized: true } };
}
