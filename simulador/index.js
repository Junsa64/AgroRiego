#!/usr/bin/env node
// Uso: npm run simular -- --codigo HS-0161 [--codigo HS-0162] [--rapido] [--una-vez] [--url mqtt://host:1883]
// Publica en agroriego/lecturas/{codigo} cada 5 minutos (o cada 10 s con --rapido).
import mqtt from 'mqtt';
import { leerArgumentos, siguienteLectura } from './lectura.js';

const opciones = leerArgumentos(process.argv.slice(2));
const estados = new Map(opciones.codigos.map((c) => [c, { humedad: 42, temperatura: 28, bateria: 95 }]));

const cliente = mqtt.connect(opciones.url, {
  username: process.env.MQTT_USUARIO || undefined,
  password: process.env.MQTT_CONTRASENA || undefined,
});

async function publicarTodas() {
  for (const [codigo, anterior] of estados) {
    const lectura = siguienteLectura(anterior);
    estados.set(codigo, lectura);
    await cliente.publishAsync(`agroriego/lecturas/${codigo}`, JSON.stringify(lectura), { qos: 1 });
    console.log(`${new Date().toLocaleTimeString('es-MX')} · ${codigo} → humedad ${lectura.humedad} %, ${lectura.temperatura} °C, batería ${lectura.bateria} %`);
  }
}

cliente.on('connect', async () => {
  console.log(`Simulador conectado a ${opciones.url} · equipos: ${opciones.codigos.join(', ')}`);
  await publicarTodas();
  if (opciones.unaVez) {
    await cliente.endAsync();
    return;
  }
  setInterval(publicarTodas, opciones.intervaloMs);
});

cliente.on('error', (error) => {
  console.error(`No se pudo conectar al broker: ${error.message}`);
});
