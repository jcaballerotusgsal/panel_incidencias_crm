import { Texto } from '@/components/idioma-context';
import type { Metadata } from 'next';
import { leerIdiomaServidor } from '@/lib/idioma-servidor';
import { traducir } from '@/lib/i18n';
import { Header, Footer } from '@/components/plant';
import { FormularioQueja } from '@/components/formulario-queja';

/** @returns Título del alta en el idioma resuelto para esta petición. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: traducir(await leerIdiomaServidor(), 'Crear una incidencia') };
}

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
          <p className="section-eyebrow"><Texto>Estamos para escucharte</Texto></p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"><Texto>Crear una incidencia</Texto></h1>
          <p className="mt-3 text-sm leading-6 text-brand-gray"><Texto>Datos de contacto e información sobre el suceso.</Texto></p>
        </div>
        <FormularioQueja />
      </main>
      <Footer />
    </div>
  );
}
