import Link from "next/link";

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

/** Presenta una pantalla de incidencias con datos de demostración. */
export default function IncidenciasPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <Link href="/" className="text-sm text-sky-700 hover:underline">
                Volver al inicio
            </Link>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
                Incidencias
            </h1>

            <p className="mt-2 text-slate-600">
                Datos de demostración. Esta pantalla no guarda cambios.
            </p>

            <IncidenciasListado incidencias={incidenciasDemo} />
        </main>
    );
}
