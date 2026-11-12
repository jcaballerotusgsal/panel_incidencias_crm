import { MarcaCorporativa, NavegacionPrincipal } from './marca-corporativa';

/** @returns Cabecera corporativa compartida con logo sustituible y navegación de consulta/quejas. */
export function Header() {
  return (
    <header className="border-t-4 border-b border-t-brand-yellow border-b-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5">
        <MarcaCorporativa />
        <NavegacionPrincipal />
      </div>
    </header>
  );
}

/** @returns Pie compartido de atención al usuario, con la identidad corporativa y sin datos de infraestructura. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-brand-gray">
        <p><span className="font-bold tracking-wide">DIREXIS TUSGSAL</span> · Atención al usuario</p>
        <p>Consultas de incidencias y quejas</p>
      </div>
    </footer>
  );
}
