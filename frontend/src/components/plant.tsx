export function Header() {
    return(
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
                <span className="text-lg font-bold tracking-tight">BACKOFFICE<span className="text-sky-700">.</span></span>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">Proyecto base · sin autenticación</span>
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