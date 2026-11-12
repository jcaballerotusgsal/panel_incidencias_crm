import Link from "next/link";
import { Header, Footer } from "@/components/plant";

import {
    IncidenciasListado,
    type Incidencia,
} from "@/components/incidencias-listado";

const incidenciasDemo: Incidencia[] = [
    {
        id: 1,
        titulo: "Impresora sin conexión",
        estado: "Cerrada",
    },
    {
        id: 2,
        titulo: "Error al acceder a la aplicación",
        estado: "Abierta",
    },
    {
        id: 3,
        titulo: "Cambio de monitor",
        estado: "Cerrada",
    },
];

/** Presenta datos de demostración con la cabecera y los estilos corporativos compartidos. */
export default function IncidenciasPage() {
    return (
      <div className="page-shell">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
            <Link href="/" className="brand-link text-sm">
                Volver al inicio
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-brand-ink">
                Incidencias
            </h1>

            <p className="mt-2 text-brand-gray">
                Datos de demostración. Esta pantalla no guarda cambios.
            </p>

            <IncidenciasListado incidencias={incidenciasDemo} />
        </main>
        <Footer />
      </div>
    );
}
