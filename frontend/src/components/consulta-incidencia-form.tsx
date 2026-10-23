'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isConsultaResponse } from '@/lib/incidencias';
import { useConsultaIncidencia } from './consulta-incidencia-context';

/**
 * Recoge código e identificador, consulta /api y navega al resultado sin datos en la URL.
 * @returns Formulario con validación de entrada, estado de espera y errores recuperables.
 */
export function ConsultaIncidenciaForm() {
  const router = useRouter();
  const { setResultado } = useConsultaIncidencia();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Envía una lectura por POST; distingue ausencia de datos de fallos de servicio.
   * @param event Envío del formulario, cuyo comportamiento HTML se cancela.
   * @returns Promesa que termina tras navegar o mostrar un error; no propaga errores de red.
   */
  async function consultar(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const codigo = data.get('codigoIncidencia');
    const identificador = data.get('identificador');
    setError(null);
    setResultado(null);
    if (typeof codigo !== 'string' || !/^[0-9]+$/.test(codigo.trim())
      || !Number.isInteger(Number(codigo)) || Number(codigo) < 1 || Number(codigo) > 2147483647
      || typeof identificador !== 'string' || !identificador.trim() || identificador.trim().length > 45) {
      setError('Introduce un código de incidencia válido y tu DNI, correo o código AMB.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/incidencias/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoIncidencia: Number(codigo), identificador: identificador.trim() }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 404) {
        setResultado({ estado: 'no-encontrada' });
      } else if (response.ok) {
        const payload: unknown = await response.json();
        if (!isConsultaResponse(payload)) throw new Error('Respuesta de consulta no válida.');
        setResultado({ estado: 'encontrada', incidencia: payload.incidencia });
      } else {
        setError(response.status === 400
          ? 'Revisa el código de incidencia y tu identificador.'
          : 'No se ha podido completar la consulta. Inténtalo de nuevo.');
        return;
      }
      router.push('/incidencias/resultado');
    } catch {
      setError('No se ha podido completar la consulta. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" onSubmit={consultar} aria-busy={pending} className="mt-6 space-y-5">
      <div>
        <label htmlFor="codigo-incidencia" className="block text-sm font-medium">
          Código de incidencia
        </label>
        <input
          id="codigo-incidencia"
          name="codigoIncidencia"
          type="text"
          inputMode="numeric"
          pattern="[0-9]+"
          maxLength={10}
          required
          placeholder="Introduce el código de incidencia"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-600 focus:outline-2 focus:outline-sky-600"
        />
      </div>
      <div>
        <label htmlFor="identificador" className="block text-sm font-medium">
          DNI, correo o código AMB
        </label>
        <input
          id="identificador"
          name="identificador"
          type="text"
          maxLength={45}
          required
          placeholder="Introduce tu DNI, correo o código AMB"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-600 focus:outline-2 focus:outline-sky-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? 'Consultando…' : 'Consultar incidencia'}
      </button>
      <div aria-live="polite">
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </div>
    </form>
  );
}
