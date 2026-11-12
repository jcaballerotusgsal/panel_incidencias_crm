import type { Metadata } from 'next';
import { Header, Footer } from '@/components/plant';
import { FormularioQueja } from '@/components/formulario-queja';

export const metadata: Metadata = {
  title: 'Crear una queja',
};

/**
 * Presenta el alta de una queja con datos personales, del suceso y reclamación.
 * @returns Página adaptable que carga las líneas y muestra el código después de confirmar el alta.
 */
export default function NuevaQuejaPage() {
  return (
    <div className="page-shell">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:py-12">
        <div className="mb-8">
          <p className="section-eyebrow">Estamos para escucharte</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Crear una queja</h1>
          <p className="mt-3 text-sm leading-6 text-brand-gray">Datos de contacto e información sobre el suceso.</p>
        </div>
        <FormularioQueja />
      </main>
      <Footer />
    </div>
  );
}
