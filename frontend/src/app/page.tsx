import { Header, Footer } from '@/components/plant';
import { ConsultaIncidenciaForm } from '@/components/consulta-incidencia-form';

/**
 * Presenta la consulta de incidencias mediante código y DNI, correo o código AMB.
 * @returns Página con un formulario que consulta la API al enviarse.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-xl px-6 py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Consulta de incidencias</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Introduce el código de incidencia y tu identificador.
          </p>
          <ConsultaIncidenciaForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
