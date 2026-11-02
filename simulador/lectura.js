// Genera lecturas creíbles: la humedad baja poco a poco (evaporación) y la batería se descarga despacio.
export function siguienteLectura(anterior, aleatorio = Math.random) {
  const humedad = Math.max(5, Math.min(60, anterior.humedad - 0.4 + (aleatorio() - 0.5) * 0.6));
  const temperatura = Math.max(10, Math.min(45, anterior.temperatura + (aleatorio() - 0.5)));
  const bateria = Math.max(0, anterior.bateria - (aleatorio() < 0.1 ? 1 : 0));
  return {
    humedad: Number(humedad.toFixed(1)),
    temperatura: Number(temperatura.toFixed(1)),
    bateria,
  };
}

export function leerArgumentos(argv) {
  const opciones = { codigos: [], rapido: false, unaVez: false, url: process.env.MQTT_URL ?? 'mqtt://localhost:1883' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--rapido') opciones.rapido = true;
    else if (arg === '--una-vez') opciones.unaVez = true;
    else if (arg === '--url') opciones.url = argv[++i];
    else if (arg === '--codigo') opciones.codigos.push(String(argv[++i]).toUpperCase());
  }
  if (!opciones.codigos.length) opciones.codigos.push('HS-0161');
  opciones.intervaloMs = opciones.rapido ? 10_000 : 5 * 60_000;
  return opciones;
}
