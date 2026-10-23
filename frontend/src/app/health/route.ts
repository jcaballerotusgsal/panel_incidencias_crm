export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Comprueba que Next.js responde, independientemente de la disponibilidad de la API. */
export function GET(): Response {
  return Response.json(
    { status: 'ok', service: 'backoffice-web' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
