"use client";

import { useState } from "react";

export type Incidencia = {
    id: number;
    titulo: string;
    estado: "Abierta" | "Cerrada";
};

type Props = {
    incidencias: readonly Incidencia[];
};

/** Muestra las incidencias recibidas y permite filtrarlas por título. */
export function IncidenciasListado({ incidencias }: Props) {
    const [busqueda, setBusqueda] = useState("");

    const filtro = busqueda.trim().toLocaleLowerCase("es");

    const visibles = incidencias.filter((incidencia) =>
        incidencia.titulo.toLocaleLowerCase("es").includes(filtro),
    );

    return (
        <section className="mt-6">
            <label
                htmlFor="buscar-incidencias"
                className="block text-sm font-medium text-slate-700"
            >
                Buscar por título
            </label>

            <input
                id="buscar-incidencias"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Por ejemplo: impresora"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 focus-visible:outline-2 focus-visible:outline-sky-700"
            />

            <p aria-live="polite" className="mt-3 text-sm text-slate-600">
                Resultados: {visibles.length}
            </p>

            <ul className="mt-4 space-y-3">
                {visibles.map((incidencia) => (
                    <li
                        key={incidencia.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <span className="font-medium">
                            #{incidencia.id} — {incidencia.titulo}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                            {incidencia.estado}
                        </span>
                    </li>
                ))}
            </ul>

            {visibles.length === 0 && (
                <p className="mt-4 text-slate-600">
                    No hay incidencias que coincidan con la búsqueda.
                </p>
            )}
        </section>
    );
}
