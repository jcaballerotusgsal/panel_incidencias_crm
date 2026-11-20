'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { esIdioma, traducir, type Idioma, type Traducir } from '@/lib/i18n';

type PreferenciaIdioma = { idioma: Idioma; cambiarIdioma: (idioma: Idioma) => void; t: Traducir };
const ContextoIdioma = createContext<PreferenciaIdioma | null>(null);

/**
 * Comparte traducciones sin remontar formularios ni el resultado de consulta.
 * @param idiomaInicial Preferencia resuelta en el servidor. @param children Aplicación.
 * @returns Proveedor; mantiene lang/título y guarda únicamente la preferencia de idioma al cambiarla.
 */
export function IdiomaProvider({ idiomaInicial, children }: { idiomaInicial: Idioma; children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);
  const pathname = usePathname();
  const t: Traducir = useCallback(texto => traducir(idioma, texto), [idioma]);

  useEffect(() => {
    document.documentElement.lang = idioma;
    const titulo = pathname === '/quejas/nueva' ? 'Crear una incidencia'
      : pathname === '/incidencias/resultado' ? 'Resultado de la consulta' : 'Atención al usuario';
    document.title = `${traducir(idioma, titulo)} | DIREXIS TUSGSAL`;
  }, [idioma, pathname]);

  /** @param nuevo Idioma del selector. Persiste la elección sin refrescar ni navegar. */
  function cambiarIdioma(nuevo: Idioma): void {
    if (!esIdioma(nuevo)) return;
    setIdioma(nuevo);
    document.cookie = `sac_idioma=${nuevo}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  return <ContextoIdioma.Provider value={{ idioma, cambiarIdioma, t }}>{children}</ContextoIdioma.Provider>;
}

/** @returns Idioma y traductor actuales. @throws Error si falta el proveedor del layout raíz. */
export function useIdioma(): PreferenciaIdioma {
  const contexto = useContext(ContextoIdioma);
  if (!contexto) throw new Error('Falta IdiomaProvider.');
  return contexto;
}

/** @param children Clave de texto estático de una página de servidor. @returns Texto traducido con el contexto activo. */
export function Texto({ children }: { children: string }) {
  const { t } = useIdioma();
  return <>{t(children)}</>;
}

/** @param idioma Idioma representado. @returns Bandera decorativa en SVG, uniforme y sin depender de emojis del sistema. */
function BanderaIdioma({ idioma }: { idioma: Idioma }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 27 18" className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10">
      {idioma === 'ca' && <>
        <path fill="#f9d616" d="M0 0h27v18H0z" />
        {[2, 6, 10, 14].map(y => <path key={y} fill="#da121a" d={`M0 ${y}h27v2H0z`} />)}
      </>}
      {idioma === 'es' && <>
        <path fill="#aa151b" d="M0 0h27v18H0z" />
        <path fill="#f1bf00" d="M0 4.5h27v9H0z" />
      </>}
      {idioma === 'en' && <>
        <path fill="#012169" d="M0 0h27v18H0z" />
        <path stroke="#fff" strokeWidth="5" d="m0 0 27 18M27 0 0 18" />
        <path stroke="#c8102e" strokeWidth="2" d="m0 0 27 18M27 0 0 18" />
        <path stroke="#fff" strokeWidth="7" d="M13.5 0v18M0 9h27" />
        <path stroke="#c8102e" strokeWidth="4" d="M13.5 0v18M0 9h27" />
      </>}
    </svg>
  );
}

/** @returns Grupo de botones con banderas y nombres, estado activo accesible y cambio sin recarga. */
export function SelectorIdioma() {
  const { idioma, cambiarIdioma, t } = useIdioma();
  const opciones: readonly { codigo: Idioma; nombre: string }[] = [
    { codigo: 'ca', nombre: 'Català' },
    { codigo: 'es', nombre: 'Español' },
    { codigo: 'en', nombre: 'English' },
  ];
  return (
    <div role="group" aria-label={t('Idioma')} className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-line bg-canvas p-1 shadow-inner">
      {opciones.map(opcion => (
        <button key={opcion.codigo} type="button" lang={opcion.codigo} aria-pressed={idioma === opcion.codigo}
          onClick={() => cambiarIdioma(opcion.codigo)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 ${idioma === opcion.codigo
            ? 'border-brand-yellow/60 bg-white text-brand-ink shadow-sm'
            : 'border-transparent text-brand-gray hover:bg-white hover:text-brand-ink'}`}>
          <BanderaIdioma idioma={opcion.codigo} />
          {opcion.nombre}
        </button>
      ))}
    </div>
  );
}
