// Cliente de la API. La sesión viaja en una cookie httpOnly, por eso se usa credentials: 'include'.
export class ErrorApi extends Error {
  constructor(mensaje, estado, campos) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos ?? {};
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'include',
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu señal e intenta de nuevo', 0);
  }
  if (respuesta.status === 204) return null;
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error ?? 'Ocurrió un error, intenta de nuevo', respuesta.status, datos?.campos);
  }
  return datos;
}
