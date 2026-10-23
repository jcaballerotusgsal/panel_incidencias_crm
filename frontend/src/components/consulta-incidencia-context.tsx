'use client';

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { ResultadoConsulta } from '@/lib/incidencias';

type ConsultaContextValue = {
  resultado: ResultadoConsulta | null;
  setResultado: Dispatch<SetStateAction<ResultadoConsulta | null>>;
};

const ConsultaContext = createContext<ConsultaContextValue | null>(null);

/**
 * Conserva la consulta durante la navegación, exclusivamente en memoria del navegador.
 * @param children Páginas que comparten el formulario y su resultado.
 * @returns Proveedor sin cookies, almacenamiento persistente ni datos en la URL.
 */
export function ConsultaIncidenciaProvider({ children }: { children: ReactNode }) {
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  return <ConsultaContext.Provider value={{ resultado, setResultado }}>{children}</ConsultaContext.Provider>;
}

/**
 * Accede al resultado provisional y permite sustituirlo o borrarlo.
 * @returns Estado compartido de la consulta actual.
 * @throws Error si se utiliza fuera de ConsultaIncidenciaProvider.
 */
export function useConsultaIncidencia(): ConsultaContextValue {
  const context = useContext(ConsultaContext);
  if (context === null) throw new Error('La consulta necesita ConsultaIncidenciaProvider.');
  return context;
}
