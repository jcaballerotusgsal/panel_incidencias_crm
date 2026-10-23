'use client';

import { useEffect, useRef, useState } from 'react';

type Health = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  database: string;
};

/** Comprueba el contrato recibido antes de mostrarlo en la interfaz. */
function isHealth(value: unknown): value is Health {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return data.status === 'ok'
    && typeof data.service === 'string'
    && typeof data.timestamp === 'string'
    && Number.isFinite(Date.parse(data.timestamp))
    && typeof data.uptimeSeconds === 'number'
    && Number.isFinite(data.uptimeSeconds)
    && typeof data.database === 'string';
}

/** Consulta la API mediante Next.js y muestra éxito, espera o error de conexión. */
export function ApiStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 8000);

    /** Realiza una comprobación con timeout; evita actualizar un componente desmontado. */
    async function checkHealth(): Promise<void> {
      const startedAt = performance.now();
      try {
        const response = await fetch('/api/health', {
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) throw new Error(`La API respondió con HTTP ${response.status}.`);
        const payload: unknown = await response.json();
        if (!isHealth(payload)) throw new Error('La API devolvió un formato inesperado.');
        if (active) {
          setHealth(payload);
          setLatency(Math.round(performance.now() - startedAt));
        }
      } catch (caught: unknown) {
        if (active) {
          setHealth(null);
          setError(controller.signal.aborted
            ? 'La API no respondió dentro del tiempo máximo.'
            : caught instanceof Error ? caught.message : 'No se pudo contactar con la API.');
        }
      } finally {
        clearTimeout(timer);
        if (active) setPending(false);
      }
    }

    void checkHealth();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [refresh]);

  /** Reinicia el estado visual y solicita una nueva comprobación. */
  function refreshStatus(): void {
    setPending(true);
    setError(null);
    setRefresh((previous) => previous + 1);
  }

  const label = pending ? 'Comprobando conexión…' : error ? 'API no disponible' : 'API conectada';

  return (
    <section aria-labelledby="api-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 id="api-title" className="text-xl font-semibold">Estado de la conexión</h2>
          <p className="mt-2 text-sm text-slate-500">Navegador → Next.js → NestJS / Express</p>
        </div>
        <button ref={refreshButton} type="button" onClick={refreshStatus} disabled={pending}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-50">
          {pending ? 'Comprobando…' : 'Volver a comprobar'}
        </button>
      </div>
      <div aria-live="polite" aria-atomic="true" className="mt-6">
        <p className={`font-semibold ${pending ? 'text-slate-600' : error ? 'text-rose-700' : 'text-emerald-700'}`}>{label}</p>
        {error && <p className="mt-2 text-sm text-rose-700">{error} Consulta los registros de Docker.</p>}
        {!pending && health && !error && (
          <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Servicio</dt><dd className="mt-1 font-medium">{health.service}</dd></div>
            <div><dt className="text-slate-500">Comprobación</dt><dd className="mt-1 font-medium">{new Date(health.timestamp).toLocaleString('es-ES')}</dd></div>
            <div><dt className="text-slate-500">Tiempo de respuesta</dt><dd className="mt-1 font-medium">{latency} ms</dd></div>
          </dl>
        )}
      </div>
    </section>
  );
}
