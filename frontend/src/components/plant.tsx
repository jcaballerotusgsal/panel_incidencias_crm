import Link from 'next/link';

/** @returns Cabecera compartida con acceso a la consulta de incidencias y al formulario de queja. */
export function Header() {
    return(
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
                <span className="text-lg font-bold tracking-tight">BACKOFFICE<span className="text-sky-700">.</span></span>
                <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
                    <Link href="/" className="transition hover:text-sky-700">Consultar incidencia</Link>
                    <Link href="/quejas/nueva" className="transition hover:text-sky-700">Crear una queja</Link>
                </nav>
            </div>
      </header>
    );
}

export function Footer() {
    return(
        <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs text-slate-500">
            Docker Compose · API interna · Código editable · Documentación compartida
        </footer>
    );
}
