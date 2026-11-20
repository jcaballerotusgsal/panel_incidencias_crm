import type { Metadata } from 'next';
import { leerIdiomaServidor } from '@/lib/idioma-servidor';
import { traducir } from '@/lib/i18n';
import { Header, Footer } from '@/components/plant';
import { ResultadoIncidencia } from '@/components/resultado-incidencia';

/** @returns Título traducido del resultado y exclusión de indexación. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: traducir(await leerIdiomaServidor(), 'Resultado de la consulta'), robots: { index: false, follow: false } };
}

/** @returns Página provisional que muestra exclusivamente el resultado conservado en memoria. */
export default function ResultadoIncidenciaPage() {
  return (
    <div className="page-shell">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-12"><ResultadoIncidencia /></main>
      <Footer />
    </div>
  );
}
