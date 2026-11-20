'use client';

import { useIdioma } from './idioma-context';

import Link from 'next/link';
import type { Incidencia } from '@/lib/incidencias';
import { traducirEstado, type Traducir } from '@/lib/i18n';
import { useConsultaIncidencia } from './consulta-incidencia-context';

type CampoResultado = {
  campo: string;
  etiqueta: string;
  fecha?: boolean;
  anchoCompleto?: boolean;
};

type GrupoResultado = {
  titulo: string;
  campos: readonly CampoResultado[];
};

// Lista explícita de campos visibles: ningún otro campo de la respuesta se renderiza.
const grupos: readonly GrupoResultado[] = [
  {
    titulo: 'Información de la incidencia',
    campos: [
      { campo: 'estados_expedientes', etiqueta: 'Estado', anchoCompleto: true },
      { campo: 'm_tipo', etiqueta: 'Tipo de incidencia' },
      { campo: 'via_recepcion', etiqueta: 'Vía de recepción' },
      { campo: 'fecha_recepcion', etiqueta: 'Fecha de recepción', fecha: true, anchoCompleto: true },
    ],
  },
  {
    titulo: 'Datos de contacto',
    campos: [
      { campo: 'dp_nombre', etiqueta: 'Nombre' },
      { campo: 'dp_apellidos', etiqueta: 'Apellidos / código AMB' },
      { campo: 'dp_dni', etiqueta: 'DNI' },
      { campo: 'dp_telefono', etiqueta: 'Teléfono' },
      { campo: 'dp_email', etiqueta: 'Correo electrónico', anchoCompleto: true },
      { campo: 'dp_correoPostal', etiqueta: 'Dirección postal', anchoCompleto: true },
    ],
  },
  {
    titulo: 'Datos del acontecimiento',
    campos: [
      { campo: 'm_fechaAcontecimiento_date', etiqueta: 'Fecha del acontecimiento', fecha: true },
      { campo: 'm_hora', etiqueta: 'Hora' },
      { campo: 'nom_linea_tusgsal', etiqueta: 'Línea' },
      { campo: 'm_vehiculo', etiqueta: 'Vehículo' },
      { campo: 'm_zona', etiqueta: 'Zona' },
      { campo: 'm_parada', etiqueta: 'Parada' },
      { campo: 'm_sentido', etiqueta: 'Sentido', anchoCompleto: true },
    ],
  },
  {
    titulo: 'Fechas del registro',
    campos: [
      { campo: 'incidencia_created_date', etiqueta: 'Creación', fecha: true, anchoCompleto: true },
      { campo: 'incidencia_date_updated', etiqueta: 'Actualización registrada', fecha: true, anchoCompleto: true },
    ],
  },
];

/**
 * Prepara columnas y estados para su lectura sin interpretar HTML ni convertir zonas horarias.
 * @param valor Columna validada de la API; puede faltar o estar vacía.
 * @param t Traductor de etiquetas y ausencias; no traduce datos personales o texto libre.
 * @param fecha Si debe presentar una fecha MySQL como día/mes/año, conservando su hora.
 * @returns Texto legible, estados distintos o «Sin expediente» para listas vacías; conserva cero y nulos.
 */
function mostrarValor(valor: Incidencia[string] | undefined, t: Traducir, fecha = false): string {
  if (Array.isArray(valor)) {
    if (valor.length === 0) return t('Sin expediente');
    // Se presentan todos los estados distintos, sin deducir cuál es el estado vigente de la incidencia.
    return [...new Set(valor.map((estado) => estado?.trim() ? traducirEstado(estado, t) : t('No informado')))].join(' · ');
  }
  if (valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim())) {
    return t('No informado');
  }
  if (fecha && typeof valor === 'string') {
    const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?$/.exec(valor);
    if (partes && partes[1] !== '0000' && partes[2] !== '00' && partes[3] !== '00') {
      return `${partes[3]}/${partes[2]}/${partes[1]}${partes[4] ? ` · ${partes[4]}` : ''}`;
    }
  }
  return String(valor);
}

/**
 * Presenta la ficha y, si existen, respuestas del CRM como texto en un recuadro verde bajo el detalle.
 * @returns Vista adaptable, con valores como texto; al recargar requiere consultar de nuevo.
 */
export function ResultadoIncidencia() {
  const { t } = useIdioma();
  const { resultado, setResultado } = useConsultaIncidencia();

  /** Borra los datos personales en memoria cuando se inicia otra consulta. */
  function nuevaConsulta(): void {
    setResultado(null);
  }

  return (
    <section aria-labelledby="resultado-titulo" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="resultado-titulo" className="text-2xl font-semibold tracking-tight text-brand-ink">
          {t("Resultado de la consulta")}
        </h1>
        <Link
          href="/"
          onClick={nuevaConsulta}
          className="button-secondary"
        >
          <span aria-hidden="true">←</span>
          {t("Volver al formulario")}
        </Link>
      </div>
      {resultado?.estado === 'encontrada' && (
        <>
          <div className="rounded-2xl border-t-4 border-brand-yellow bg-brand-ink p-6 text-white shadow-sm sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-brand-ink">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("Consulta completada")}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('Incidencia')} #{resultado.incidencia.id}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/85">{t("Información de la incidencia consultada.")}</p>
          </div>

          <section aria-labelledby="detalle-titulo" className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <h3 id="detalle-titulo" className="text-lg font-semibold text-brand-ink">{t("Detalle de la incidencia")}</h3>
            <p className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-brand-yellow/30 bg-brand-soft p-5 text-sm leading-7 text-brand-ink">
              {mostrarValor(resultado.incidencia.m_detalle, t)}
            </p>
          </section>

          {resultado.incidencia.respuestas.length > 0 && (
            <section aria-labelledby="respuesta-titulo" className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
              <h3 id="respuesta-titulo" className="text-lg font-semibold text-brand-ink">{t("Respuesta a la incidencia")}</h3>
              <div className="mt-4 space-y-4 rounded-xl border border-green-600/30 bg-green-50 p-5 text-sm leading-7 text-brand-ink">
                {resultado.incidencia.respuestas.map((respuesta, indice) => (
                  <p key={indice} className="whitespace-pre-wrap break-words">{respuesta}</p>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {grupos.map((grupo) => (
              <section key={grupo.titulo} aria-label={t(grupo.titulo)} className="min-w-0 rounded-2xl border border-line bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-3 text-base font-semibold text-brand-ink">
                  <span aria-hidden="true" className="h-5 w-1 rounded-full bg-brand-yellow" />
                  {t(grupo.titulo)}
                </h3>
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {grupo.campos.map((campo) => (
                    <div key={campo.campo} className={campo.anchoCompleto ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
                      <dt className="text-xs font-medium text-brand-gray">{t(campo.etiqueta)}</dt>
                      <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-brand-ink">
                        {(campo.campo === 'm_tipo' && resultado.incidencia.m_tipo === 'Queja')
                          || (campo.campo === 'via_recepcion' && resultado.incidencia.via_recepcion === 'formulario web')
                          ? t(mostrarValor(resultado.incidencia[campo.campo], t, campo.fecha))
                          : mostrarValor(resultado.incidencia[campo.campo], t, campo.fecha)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
      {resultado?.estado === 'no-encontrada' && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <p role="status" className="text-brand-gray">{t("No se han encontrado los datos.")}</p>
        </div>
      )}
      {resultado === null && (
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <p className="text-brand-gray">{t("Realiza una consulta desde el formulario para ver el resultado.")}</p>
        </div>
      )}
    </section>
  );
}
