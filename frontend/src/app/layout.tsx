import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backoffice | Entorno de desarrollo',
  description: 'Base con NestJS, Express, Next.js, React y Tailwind CSS.',
};

/** Define el documento HTML y aplica los estilos globales de la interfaz. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
