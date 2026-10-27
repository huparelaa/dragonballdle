import { evaluarIntento } from "@/juego/reto";

/**
 * `POST /api/intento` — recibe `{ id }` y devuelve la comparación contra el
 * objetivo del día. La comparación corre acá y no en el cliente: si el objetivo
 * viajara al navegador, se leería del bundle y el juego se rompe.
 *
 * Es un Route Handler y no una Server Action a propósito (README §6): es un
 * contrato HTTP, así que el día que esto se mude a .NET solo cambia la URL base.
 */

/** El intento depende del día, así que nunca se cachea. */
export const dynamic = "force-dynamic";

function leerId(cuerpo: unknown): string | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const { id } = cuerpo as { id?: unknown };
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function POST(peticion: Request): Promise<Response> {
  const cuerpo: unknown = await peticion.json().catch(() => null);
  const id = leerId(cuerpo);

  if (!id) {
    return Response.json({ error: 'Se espera un cuerpo JSON con { "id": string }.' }, { status: 400 });
  }

  const respuesta = evaluarIntento(id);
  if (!respuesta) {
    return Response.json({ error: `No existe el personaje "${id}".` }, { status: 404 });
  }

  return Response.json(respuesta, { headers: { "Cache-Control": "no-store" } });
}
