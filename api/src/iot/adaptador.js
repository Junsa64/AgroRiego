// Adaptador IoT (T1.11): cliente MQTT de la API. Aísla al resto del sistema del protocolo del hardware.
import mqtt from 'mqtt';
import { procesarLectura } from '../modulos/dispositivos.js';

export const TOPICO_LECTURAS = 'agroriego/lecturas/+';

export function iniciarAdaptadorIoT({ pool, url = process.env.MQTT_URL, opciones = {}, registro = console }) {
  if (!url) {
    registro.warn('MQTT_URL no está definida: el adaptador IoT no se inicia');
    return null;
  }
  const cliente = mqtt.connect(url, {
    username: process.env.MQTT_USUARIO || undefined,
    password: process.env.MQTT_CONTRASENA || undefined,
    reconnectPeriod: 2000,
    ...opciones,
  });

  cliente.on('connect', () => {
    cliente.subscribe(TOPICO_LECTURAS, { qos: 1 });
    registro.log?.(`Adaptador IoT conectado a ${url}`);
  });

  cliente.on('message', async (topico, mensaje) => {
    const codigo = topico.split('/').at(-1);
    let datos;
    try {
      datos = JSON.parse(mensaje.toString());
    } catch {
      registro.warn?.(`Lectura con formato inválido de ${codigo}`);
      return;
    }
    try {
      const resultado = await procesarLectura(pool, codigo, datos, { registro });
      cliente.emit('lectura-procesada', { codigo, ...resultado });
    } catch (error) {
      registro.error?.('Error al guardar la lectura', error);
    }
  });

  cliente.on('error', (error) => registro.error?.('Error MQTT', error.message));
  return cliente;
}
