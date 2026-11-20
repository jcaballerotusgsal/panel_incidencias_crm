import ca from '@/messages/ca.json';
import es from '@/messages/es.json';
import en from '@/messages/en.json';

export type Idioma = 'ca' | 'es' | 'en';
export type Traducir = (texto: string) => string;
const mensajes: Record<Idioma, Record<string, string>> = { ca, es, en };

/** @param valor Preferencia externa. @returns Si es uno de los tres idiomas admitidos. */
export function esIdioma(valor: unknown): valor is Idioma {
  return valor === 'ca' || valor === 'es' || valor === 'en';
}

/**
 * Elige cookie válida, después idioma del navegador por prioridad y finalmente catalán.
 * @param cookie Valor de la cookie, sin confianza implícita. @param cabecera Accept-Language.
 * @returns Idioma soportado; ignora preferencias con calidad cero o no válidas.
 */
export function elegirIdioma(cookie: unknown, cabecera: string): Idioma {
  if (esIdioma(cookie)) return cookie;
  const preferencias = cabecera.split(',').map((parte, indice) => {
    const [etiqueta, calidad] = parte.trim().split(';');
    const peso = calidad === undefined ? 1 : Number(calidad.trim().replace(/^q=/, ''));
    return { idioma: etiqueta.toLowerCase().split('-')[0], peso, indice };
  }).filter(item => Number.isFinite(item.peso) && item.peso > 0 && item.peso <= 1)
    .sort((a, b) => b.peso - a.peso || a.indice - b.indice);
  for (const preferencia of preferencias) {
    if (esIdioma(preferencia.idioma)) return preferencia.idioma;
  }
  return 'ca';
}

/** @param idioma Idioma comprobado. @param texto Clave editorial en español. @returns Traducción o texto original si falta la clave. */
export function traducir(idioma: Idioma, texto: string): string {
  return Object.hasOwn(mensajes[idioma], texto) ? mensajes[idioma][texto] : texto;
}

/** @param estado Texto del CRM. @param t Traductor activo. @returns Etiqueta conocida traducida o texto histórico sin modificar. */
export function traducirEstado(estado: string, t: Traducir): string {
  const conocidos: Record<string, string> = {
    pendiente: 'Pendiente', 'en revision': 'En revisión', 'en revisión': 'En revisión',
    cerrada: 'Cerrada', cerrado: 'Cerrada', abierta: 'Abierta', abierto: 'Abierta',
  };
  const clave = estado.trim().toLowerCase();
  return Object.hasOwn(conocidos, clave) ? t(conocidos[clave]) : estado;
}
