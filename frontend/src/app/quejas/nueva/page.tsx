import type { Metadata } from 'next';
import { Header, Footer } from '@/components/plant';
import { FormularioQueja } from '@/components/formulario-queja';

export const metadata: Metadata = {
  title: 'Crear una queja | Incidencias',
};

/**
 * Presenta la estructura de una nueva queja con datos personales, del suceso y reclamación.
 * @returns Página adaptable con catálogo de líneas de lectura y envío desactivado.
 */
export default function NuevaQuejaPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Crear una queja</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Datos de contacto e información sobre el suceso.</p>
        </div>
        <FormularioQueja />
      </main>
      <Footer />
    </div>
  );
}
