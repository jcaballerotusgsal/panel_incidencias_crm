"use client";

import { useState } from "react";
import { useIdioma } from './idioma-context';
import { traducirEstado } from '@/lib/i18n';

export type Incidencia = {
    id: number;
    titulo: string;
    estado: "Abierta" | "Cerrada";
};

type Props = {
    incidencias: readonly Incidencia[];
};

/** Muestra los datos recibidos sin traducir sus títulos; localiza controles/estados y conserva el filtro al cambiar idioma. */
export function IncidenciasListado({ incidencias }: Props) {
    const { t, idioma } = useIdioma();
    const [busqueda, setBusqueda] = useState("");

    const filtro = busqueda.trim().toLocaleLowerCase(idioma);

    const visibles = incidencias.filter((incidencia) =>
        incidencia.titulo.toLocaleLowerCase(idioma).includes(filtro),
    );

    return (
        <section className="mt-6">
            <label
                htmlFor="buscar-incidencias"
                className="block text-sm font-medium text-brand-ink"
            >
                {t('Buscar por título')}
            </label>

            <input
                id="buscar-incidencias"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder={t('Por ejemplo: impresora')}
                className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-3 focus-visible:outline-2 focus-visible:outline-brand-gray"
            />

            <p aria-live="polite" className="mt-3 text-sm text-brand-gray">
                {t('Resultados')}: {visibles.length}
            </p>

            <ul className="mt-4 space-y-3">
                {visibles.map((incidencia) => (
                    <li
                        key={incidencia.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4"
                    >
                        <span className="font-medium">
                            #{incidencia.id} — {incidencia.titulo}
                        </span>

                        <span className="rounded-full bg-canvas px-3 py-1 text-sm">
                            {traducirEstado(incidencia.estado, t)}
                        </span>
                    </li>
                ))}
            </ul>

            {visibles.length === 0 && (
                <p className="mt-4 text-brand-gray">
                    {t('No hay incidencias que coincidan con la búsqueda.')}
                </p>
            )}
        </section>
    );
}
