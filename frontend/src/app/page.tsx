import { Texto } from '@/components/idioma-context';
import { Header, Footer } from '@/components/plant';
import { ConsultaIncidenciaForm } from '@/components/consulta-incidencia-form';
import Link from 'next/link';

/**
 * Presenta la consulta de incidencias con identidad corporativa y acceso al alta de quejas.
 * @returns Página adaptable con el formulario existente, sin cambiar su contrato con la API.
 */
export default function HomePage() {
  return (
    <div className="page-shell">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className="section-eyebrow"><Texto>Atención al usuario</Texto></p>
          <h1 className="mt-5 max-w-lg text-4xl leading-tight font-bold tracking-tight sm:text-5xl"><Texto>Consulta de incidencias</Texto></h1>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-gray">
            <Texto>Consulta la información y el estado de tu incidencia de forma sencilla.</Texto>
          </p>
          <div className="mt-8 hidden max-w-md border-l-4 border-brand-yellow pl-5 lg:block">
            <p className="text-sm font-semibold"><Texto>¿Quieres comunicarnos una incidencia?</Texto></p>
            <Link href="/quejas/nueva" className="brand-link mt-2 inline-flex items-center gap-2 text-sm">
              <Texto>Crear una incidencia</Texto> <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <section aria-labelledby="consulta-formulario-titulo" className="surface-card relative overflow-hidden p-6 sm:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-brand-yellow" />
          <h2 id="consulta-formulario-titulo" className="text-xl font-bold tracking-tight"><Texto>Consulta tu incidencia</Texto></h2>
          <p className="mt-3 text-sm leading-6 text-brand-gray"><Texto>Introduce el código que recibiste y tu DNI, correo o código AMB.</Texto></p>
          <ConsultaIncidenciaForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
