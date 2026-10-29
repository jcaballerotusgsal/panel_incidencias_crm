'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { isLineasResponse, type Linea } from '@/lib/lineas';

type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: 'text' | 'email' | 'tel' | 'time';
  autoComplete?: string;
  obligatorio?: boolean;
  anchoCompleto?: boolean;
  placeholder?: string;
  maxLength?: number;
};

type CatalogoLineas =
  | { estado: 'cargando' }
  | { estado: 'disponible'; lineas: Linea[] }
  | { estado: 'error' };

const estiloCampo = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-2 focus:outline-sky-600 disabled:bg-slate-100 disabled:text-slate-500';

const camposPersonales: readonly Campo[] = [
  { nombre: 'nombre', etiqueta: 'Nombre', autoComplete: 'given-name', obligatorio: true },
  { nombre: 'apellidos', etiqueta: 'Apellidos', autoComplete: 'family-name', obligatorio: true },
  { nombre: 'direccion', etiqueta: 'Dirección', autoComplete: 'street-address', anchoCompleto: true, placeholder: 'Calle, número y piso' },
  { nombre: 'codigoPostal', etiqueta: 'Código postal', autoComplete: 'postal-code', placeholder: 'Ej. 08911' },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', autoComplete: 'tel' },
  { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', autoComplete: 'email', obligatorio: true, placeholder: 'nombre@ejemplo.com' },
  { nombre: 'dni', etiqueta: 'DNI', autoComplete: 'off' },
];

/**
 * Presenta un campo de la estructura del formulario con etiqueta y obligatoriedad nativa.
 * @param campo Configuración visual y atributos HTML del campo; no define escrituras al CRM.
 * @returns Entrada accesible que conserva lo escrito únicamente en el formulario actual.
 */
function CampoFormulario({ campo }: { campo: Campo }) {
  const id = `queja-${campo.nombre}`;
  return (
    <div className={campo.anchoCompleto ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {campo.etiqueta}{campo.obligatorio && <span aria-hidden="true" className="text-rose-600"> *</span>}
      </label>
      <input
        id={id}
        name={campo.nombre}
        type={campo.tipo ?? 'text'}
        autoComplete={campo.autoComplete}
        required={campo.obligatorio}
        placeholder={campo.placeholder}
        maxLength={campo.maxLength}
        className={estiloCampo}
      />
    </div>
  );
}

/**
 * Prepara los campos de una queja y carga únicamente el catálogo de líneas de lectura.
 * @returns Formulario sin envío ni guardado, con estados de carga, ausencia y error del catálogo.
 */
export function FormularioQueja() {
  const [catalogo, setCatalogo] = useState<CatalogoLineas>({ estado: 'cargando' });

  // Cancela la lectura al desmontar y limita su duración; ninguna entrada personal se envía.
  useEffect(() => {
    const controller = new AbortController();
    let activo = true;
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    /**
     * Carga y valida las opciones desde /api; los fallos se representan como estado de interfaz.
     * @returns Promesa sin errores propagados; actualiza el catálogo solo si sigue montado.
     */
    async function cargarLineas(): Promise<void> {
      try {
        const response = await fetch('/api/lineas', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Catálogo no disponible.');
        const payload: unknown = await response.json();
        if (!isLineasResponse(payload)) throw new Error('Catálogo no válido.');
        if (activo) setCatalogo({ estado: 'disponible', lineas: payload.lineas });
      } catch {
        if (activo) setCatalogo({ estado: 'error' });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void cargarLineas();
    return () => {
      activo = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  /**
   * Cancela también los envíos por teclado o programáticos de este formulario provisional.
   * @param event Evento de envío; se evita su petición HTTP y la navegación predeterminada.
   * @returns No envía, guarda ni registra los datos personales introducidos.
   */
  function evitarEnvio(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
  }

  const lineas = catalogo.estado === 'disponible' ? catalogo.lineas : [];
  const textoOpcion = catalogo.estado === 'cargando' ? 'Cargando líneas…'
    : catalogo.estado === 'error' ? 'Líneas no disponibles'
      : lineas.length === 0 ? 'No hay líneas disponibles' : 'Selecciona una línea';

  return (
    <form method="post" onSubmit={evitarEnvio} className="space-y-8">
      <p className="text-sm text-slate-600">Los campos marcados con un asterisco (*) son obligatorios.</p>

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend className="px-2 text-base font-semibold text-slate-900">Datos personales</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          {camposPersonales.map((campo) => <CampoFormulario key={campo.nombre} campo={campo} />)}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend className="px-2 text-base font-semibold text-slate-900">Datos del suceso</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="queja-fecha" className="block text-sm font-medium text-slate-700">
              Fecha<span aria-hidden="true" className="text-rose-600"> *</span>
            </label>
            <input id="queja-fecha" name="fecha" type="text" required maxLength={10} pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}" placeholder="dd-mm-aaaa" aria-describedby="queja-fecha-formato" className={estiloCampo} />
            <p id="queja-fecha-formato" className="mt-2 text-xs text-slate-500">Formato: día-mes-año (dd-mm-aaaa).</p>
          </div>
          <CampoFormulario campo={{ nombre: 'hora', etiqueta: 'Hora', tipo: 'time', obligatorio: true }} />
          <div className="min-w-0">
            <label htmlFor="queja-linea" className="block text-sm font-medium text-slate-700">
              Línea<span aria-hidden="true" className="text-rose-600"> *</span>
            </label>
            <select id="queja-linea" name="linea" required defaultValue="" disabled={catalogo.estado !== 'disponible' || lineas.length === 0} aria-busy={catalogo.estado === 'cargando'} aria-describedby="queja-linea-ayuda" className={estiloCampo}>
              <option value="" disabled>{textoOpcion}</option>
              {lineas.map((linea) => <option key={linea.id_linea_amb} value={linea.id_linea_amb}>{linea.nom_linea_tusgsal.trim()}</option>)}
            </select>
            <p id="queja-linea-ayuda" role="status" className={catalogo.estado === 'error' ? 'mt-2 text-xs text-rose-700' : 'mt-2 text-xs text-slate-500'}>
              {catalogo.estado === 'error' ? 'No se han podido cargar las líneas. Inténtalo de nuevo más tarde.'
                : catalogo.estado === 'cargando' ? 'Cargando el catálogo de líneas.'
                  : lineas.length === 0 ? 'No hay líneas disponibles para seleccionar.' : 'Selecciona la línea en la que ocurrió el suceso.'}
            </p>
          </div>
          <CampoFormulario campo={{ nombre: 'numeroVehiculo', etiqueta: 'Núm. vehículo', placeholder: 'Número del autobús' }} />
          <CampoFormulario campo={{ nombre: 'lugar', etiqueta: 'Lugar', anchoCompleto: true, placeholder: 'Lugar de los hechos' }} />
          <CampoFormulario campo={{ nombre: 'parada', etiqueta: 'Parada' }} />
          <CampoFormulario campo={{ nombre: 'sentido', etiqueta: 'Sentido', placeholder: 'Dirección del autobús' }} />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend className="px-2 text-base font-semibold text-slate-900">Tu reclamación</legend>
        <label htmlFor="queja-motivo" className="block text-sm font-medium text-slate-700">Motivo de reclamación</label>
        <textarea id="queja-motivo" name="motivo" rows={6} placeholder="Describe qué ha ocurrido." className={estiloCampo} />
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">El envío de este formulario todavía no está disponible.</p>
        <button type="submit" disabled className="rounded-lg bg-sky-700 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Enviar queja</button>
      </div>
    </form>
  );
}
