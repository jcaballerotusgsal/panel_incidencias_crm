'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * Carga el PNG corporativo de la ruta fija; presenta el nombre mientras falta o se descarga.
 * @returns Enlace al inicio con dimensiones estables y nombre accesible, sin imagen rota visible.
 * @remarks Añadir public/brand/logo-direxis-tusgsal.png y recargar basta en desarrollo.
 */
export function MarcaCorporativa() {
  const [logoDisponible, setLogoDisponible] = useState(false);

  return (
    <Link href="/" aria-label="DIREXIS TUSGSAL. Inicio" className="relative block h-14 w-48 shrink-0 sm:w-56">
      <span aria-hidden="true" className={`absolute inset-0 flex flex-col justify-center ${logoDisponible ? 'invisible' : ''}`}>
        <span className="text-2xl leading-none font-extrabold tracking-[0.13em] text-brand-ink">DIREXIS</span>
        <span className="mt-2 flex items-center gap-2 text-xs font-bold tracking-[0.24em] text-brand-gray">
          <span className="h-1 w-6 rounded-full bg-brand-yellow" />TUSGSAL
        </span>
      </span>
      <Image
        src="/brand/logo-direxis-tusgsal.png"
        alt=""
        width={224}
        height={56}
        unoptimized
        loading="eager"
        onLoad={() => setLogoDisponible(true)}
        onError={() => setLogoDisponible(false)}
        className={`h-full w-full object-contain object-left ${logoDisponible ? 'opacity-100' : 'opacity-0'}`}
      />
    </Link>
  );
}

/**
 * Señala la sección activa sin cambiar las rutas ni el funcionamiento de los formularios.
 * @returns Navegación adaptable con aria-current y contraste corporativo.
 */
export function NavegacionPrincipal() {
  const pathname = usePathname();
  const enlaces = [
    { href: '/', texto: 'Consultar incidencia', activo: pathname === '/' || pathname === '/incidencias/resultado' },
    { href: '/quejas/nueva', texto: 'Crear una queja', activo: pathname === '/quejas/nueva' },
  ];

  return (
    <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-2 text-sm">
      {enlaces.map((enlace) => (
        <Link key={enlace.href} href={enlace.href} aria-current={enlace.activo ? 'page' : undefined}
          className={`rounded-lg px-3 py-2.5 font-semibold transition-colors sm:px-4 ${enlace.activo
            ? 'bg-brand-soft text-brand-ink shadow-[inset_0_-3px_0_var(--brand-yellow)]'
            : 'text-brand-gray hover:bg-canvas hover:text-brand-ink'}`}>
          {enlace.texto}
        </Link>
      ))}
    </nav>
  );
}
