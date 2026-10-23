import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConsultaIncidenciaProvider } from '@/components/consulta-incidencia-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backoffice | Entorno de desarrollo',
  description: 'Base con NestJS, Express, Next.js, React y Tailwind CSS.',
};

/**
 * Define el documento y comparte el resultado de consulta solo en memoria del navegador.
 * @param children Contenido de la ruta activa.
 * @returns Documento en español con estilos globales y el proveedor de consulta.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="es"><body><ConsultaIncidenciaProvider>{children}</ConsultaIncidenciaProvider></body></html>;
}
