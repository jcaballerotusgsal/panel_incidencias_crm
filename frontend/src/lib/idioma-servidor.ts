import { cookies, headers } from 'next/headers';
import { elegirIdioma, type Idioma } from './i18n';

/** @returns Preferencia de idioma por petición; solo lee la cookie de idioma y Accept-Language. */
export async function leerIdiomaServidor(): Promise<Idioma> {
  const [almacen, cabeceras] = await Promise.all([cookies(), headers()]);
  return elegirIdioma(almacen.get('sac_idioma')?.value, cabeceras.get('accept-language') ?? '');
}
