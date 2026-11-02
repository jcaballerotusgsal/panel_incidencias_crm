import type { Metadata } from 'next';
import { Header, Footer } from '@/components/plant';
import { ResultadoIncidencia } from '@/components/resultado-incidencia';

export const metadata: Metadata = {
  title: 'Resultado de la consulta | Incidencias',
  robots: { index: false, follow: false },
};

/** @returns Página provisional que muestra exclusivamente el resultado conservado en memoria. */
export default function ResultadoIncidenciaPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12"><ResultadoIncidencia /></main>
      <Footer />
    </div>
  );
}
