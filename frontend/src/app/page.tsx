import Link from 'next/link';

import { ApiStatus } from '@/components/api-status';
import { Header, Footer } from '@/components/plant';

const technologies = [
  { label: 'Backend', title: 'NestJS + Express', detail: 'API modular ejecutada en Node.js. Lógica y validación en el servidor.' },
  { label: 'Frontend', title: 'Next.js + React', detail: 'Interfaz con App Router y TypeScript. Conexión a la API desde el mismo origen.' },
  { label: 'Estilos', title: 'Tailwind CSS', detail: 'Utilidades de diseño integradas con PostCSS. Edita los componentes para personalizar.' },
];

/** Muestra el punto de partida del backoffice; no representa datos empresariales reales. */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-bold tracking-widest text-sky-700">ENTORNO DE DESARROLLO</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Tu backoffice empieza aquí.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Una base para desarrollar la interfaz y la API por separado.
          Comprueba la conexión real con NestJS antes de añadir tus módulos.
        </p>
        <section aria-label="Tecnologías del proyecto" className="mt-10 grid gap-5 md:grid-cols-3">
          {technologies.map((technology) => (
            <article key={technology.label} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{technology.label}</p>
              <h2 className="mt-3 text-xl font-semibold">{technology.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{technology.detail}</p>
            </article>
          ))}
        </section>
        <ApiStatus />
        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6">
          <h2 className="font-semibold">Siguiente paso: tus módulos de gestión</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            El proyecto todavía no incluye usuarios, permisos, datos ni conexión a una base de datos.
            La documentación de arquitectura y desarrollo está en la carpeta <code>docs/</code>.
          </p>
        </section>
        <section>
          <h2 className="mt-6 font-semibold">Más información</h2>
          <Link href="/incidencias" className="mt-2 block text-sm leading-6 text-slate-600 hover:text-sky-700">Arquitectura del proyecto</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
