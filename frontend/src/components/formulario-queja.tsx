'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isLineasResponse, type Linea } from '@/lib/lineas';
import { isQuejaCreada, type QuejaCreada } from '@/lib/quejas';

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
  { nombre: 'nombre', etiqueta: 'Nombre', autoComplete: 'given-name', obligatorio: true, maxLength: 45 },
  { nombre: 'apellidos', etiqueta: 'Apellidos', autoComplete: 'family-name', obligatorio: true, maxLength: 45 },
  { nombre: 'direccion', etiqueta: 'Dirección', autoComplete: 'street-address', anchoCompleto: true, placeholder: 'Calle, número y piso', maxLength: 1000 },
  { nombre: 'codigoPostal', etiqueta: 'Código postal', autoComplete: 'postal-code', placeholder: 'Ej. 08911', maxLength: 20 },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', autoComplete: 'tel', maxLength: 45 },
  { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', autoComplete: 'email', obligatorio: true, placeholder: 'nombre@ejemplo.com', maxLength: 45 },
  { nombre: 'dni', etiqueta: 'DNI', autoComplete: 'off', maxLength: 10 },
];

/**
 * Presenta un campo de la estructura del formulario con etiqueta y obligatoriedad nativa.
 * @param campo Configuración visual y límites de entrada acordes al contrato de la API.
 * @returns Entrada accesible del formulario, que se recoge al enviar.
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
 * Carga el catálogo y envía la nueva queja a la API, evitando envíos simultáneos.
 * @returns Formulario con errores recuperables o confirmación del código generado tras el alta.
 */
export function FormularioQueja() {
  const [catalogo, setCatalogo] = useState<CatalogoLineas>({ estado: 'cargando' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<QuejaCreada | null>(null);
  const bloqueoEnvio = useRef(false);

  // Cancela la lectura del catálogo al desmontar y limita su duración.
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
   * Envía JSON al backend; el estado de confirmación no conserva los datos personales.
   * @param event Envío nativo, cancelado para controlar la petición y la respuesta.
   * @returns Promesa que termina mostrando el código creado o un error, sin reenvíos automáticos.
   */
  async function enviarQueja(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (bloqueoEnvio.current || creada !== null) return;
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, string | number> = {};
    for (const [nombre, valor] of data.entries()) {
      if (typeof valor !== 'string') {
        setError('Revisa los campos del formulario.');
        return;
      }
      payload[nombre] = valor;
    }
    const linea = data.get('linea');
    if (catalogo.estado !== 'disponible' || !catalogo.lineas.length || typeof linea !== 'string'
      || !linea.trim() || !Number.isSafeInteger(Number(linea))) {
      setError('Selecciona una línea disponible.');
      return;
    }
    payload.linea = Number(linea);
    bloqueoEnvio.current = true;
    setEnviando(true);
    try {
      const response = await fetch('/api/quejas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(30000),
      });
      if (response.status === 400) {
        setError('Revisa los campos, la fecha y la línea seleccionada.');
        return;
      }
      if (response.status !== 201) throw new Error('No se ha confirmado el alta.');
      const resultado: unknown = await response.json();
      if (!isQuejaCreada(resultado)) throw new Error('Confirmación no válida.');
      form.reset();
      setCreada(resultado);
    } catch {
      setError('No se ha podido confirmar el envío. Puede haberse registrado; compruébalo antes de volver a enviarlo.');
    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  }

  /** Limpia la confirmación y vuelve a presentar un formulario vacío sin repetir la petición anterior. */
  function nuevaQueja(): void {
    setCreada(null);
    setError(null);
  }

  if (creada !== null) {
    return (
      <section role="status" className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-emerald-800">Tu queja se ha registrado</h2>
        <p className="mt-4 text-slate-700">Código de incidencia: <strong className="break-all">{creada.codigoIncidencia}</strong></p>
        <p className="mt-2 text-sm text-slate-600">Estado: {creada.estado}. Conserva el código para consultar tu incidencia.</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/" className="text-sky-700 underline underline-offset-4">Consultar una incidencia</Link>
          <button type="button" onClick={nuevaQueja} className="text-sky-700 underline underline-offset-4">Crear otra queja</button>
        </div>
      </section>
    );
  }

  const lineas = catalogo.estado === 'disponible' ? catalogo.lineas : [];
  const textoOpcion = catalogo.estado === 'cargando' ? 'Cargando líneas…'
    : catalogo.estado === 'error' ? 'Líneas no disponibles'
      : lineas.length === 0 ? 'No hay líneas disponibles' : 'Selecciona una línea';

  return (
    <form method="post" onSubmit={enviarQueja} aria-busy={enviando} className="space-y-8">
      <p className="text-sm text-slate-600">Los campos marcados con un asterisco (*) son obligatorios.</p>

      <fieldset disabled={enviando} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend className="px-2 text-base font-semibold text-slate-900">Datos personales</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          {camposPersonales.map((campo) => <CampoFormulario key={campo.nombre} campo={campo} />)}
        </div>
      </fieldset>

      <fieldset disabled={enviando} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
          <CampoFormulario campo={{ nombre: 'numeroVehiculo', etiqueta: 'Núm. vehículo', placeholder: 'Número del autobús', maxLength: 45 }} />
          <CampoFormulario campo={{ nombre: 'lugar', etiqueta: 'Lugar', anchoCompleto: true, placeholder: 'Lugar de los hechos', maxLength: 1000 }} />
          <CampoFormulario campo={{ nombre: 'parada', etiqueta: 'Parada', maxLength: 80 }} />
          <CampoFormulario campo={{ nombre: 'sentido', etiqueta: 'Sentido', placeholder: 'Dirección del autobús', maxLength: 80 }} />
        </div>
      </fieldset>

      <fieldset disabled={enviando} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <legend className="px-2 text-base font-semibold text-slate-900">Tu reclamación</legend>
        <label htmlFor="queja-motivo" className="block text-sm font-medium text-slate-700">Motivo de reclamación</label>
        <textarea id="queja-motivo" name="motivo" rows={6} maxLength={20000} placeholder="Describe qué ha ocurrido." className={estiloCampo} />
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Recibirás un código al completar el registro.</p>
        <button type="submit" disabled={enviando || catalogo.estado !== 'disponible' || lineas.length === 0} className="rounded-lg bg-sky-700 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{enviando ? 'Enviando…' : 'Enviar queja'}</button>
      </div>
      <div aria-live="polite">{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</div>
    </form>
  );
}
