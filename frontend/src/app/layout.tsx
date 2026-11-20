import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConsultaIncidenciaProvider } from '@/components/consulta-incidencia-context';
import { IdiomaProvider } from '@/components/idioma-context';
import { leerIdiomaServidor } from '@/lib/idioma-servidor';
import { traducir } from '@/lib/i18n';
import './globals.css';

/** @returns Título y descripción en el idioma resuelto para la petición actual. */
export async function generateMetadata(): Promise<Metadata> {
  const idioma = await leerIdiomaServidor();
  return {
    title: { default: `${traducir(idioma, 'Atención al usuario')} | DIREXIS TUSGSAL`, template: '%s | DIREXIS TUSGSAL' },
    description: traducir(idioma, 'Consulta de incidencias y presentación de quejas de DIREXIS TUSGSAL.'),
  };
}

/**
 * Define el documento y comparte el resultado de consulta solo en memoria del navegador.
 * @param children Contenido de la ruta activa.
 * @returns Documento con idioma inicial coherente entre servidor y navegador y proveedores persistentes.
 */
export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const idioma = await leerIdiomaServidor();
  return <html lang={idioma}><body><IdiomaProvider idiomaInicial={idioma}><ConsultaIncidenciaProvider>{children}</ConsultaIncidenciaProvider></IdiomaProvider></body></html>;
}
