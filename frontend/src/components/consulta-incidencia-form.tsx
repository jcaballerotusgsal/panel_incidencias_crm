'use client';

import { useIdioma } from './idioma-context';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { isConsultaResponse } from '@/lib/incidencias';
import { errorControlQueja } from '@/lib/validaciones-queja';
import { useConsultaIncidencia } from './consulta-incidencia-context';

/**
 * Recoge código e identificador, consulta /api y navega al resultado sin datos en la URL.
 * @returns Formulario con validación de entrada, estado de espera y errores recuperables.
 */
export function ConsultaIncidenciaForm() {
  const { t } = useIdioma();
  const router = useRouter();
  const { setResultado } = useConsultaIncidencia();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const referencia = useRef<HTMLFormElement>(null);

  useEffect(() => {
    for (const entrada of Array.from(referencia.current?.elements ?? [])) {
      if (entrada instanceof HTMLInputElement && entrada.validity.customError) {
        const mensaje = errorControlQueja(entrada);
        entrada.setCustomValidity(mensaje ? t(mensaje) : '');
      }
    }
  }, [t]);

  /**
   * Envía los campos originales por POST para consultarlos y registrarlos en el backend.
   * @param event Envío del formulario, cuyo comportamiento HTML se cancela.
   * @returns Promesa que termina tras navegar o mostrar un error; no propaga errores de red.
   */
  async function consultar(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    for (const entrada of Array.from(form.elements)) {
      if (entrada instanceof HTMLInputElement) {
        const mensaje = errorControlQueja(entrada);
        entrada.setCustomValidity(mensaje ? t(mensaje) : '');
      }
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
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
        body: JSON.stringify({ codigoIncidencia: codigo, identificador }),
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
    <form ref={referencia} method="post" noValidate onSubmit={consultar} aria-busy={pending} className="mt-6 space-y-5">
      <div>
        <label htmlFor="codigo-incidencia" className="block text-sm font-medium">
          {t("Código de incidencia")}
        </label>
        <input
          id="codigo-incidencia"
          name="codigoIncidencia"
          type="text"
          inputMode="numeric"
          pattern="[0-9]+"
          maxLength={10}
          required
          placeholder={t("Introduce el código de incidencia")}
          className="form-input"
        />
      </div>
      <div>
        <label htmlFor="identificador" className="block text-sm font-medium">
          {t("DNI, correo o código AMB")}
        </label>
        <input
          id="identificador"
          name="identificador"
          type="text"
          maxLength={45}
          required
          placeholder={t("Introduce tu DNI, correo o código AMB")}
          className="form-input"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="button-primary w-full"
      >
        {t(pending ? 'Consultando…' : 'Consultar incidencia')}
      </button>
      <div aria-live="polite">
        {error && <p role="alert" className="text-sm text-rose-700">{t(error)}</p>}
      </div>
    </form>
  );
}
