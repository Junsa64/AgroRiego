// T1.14 · Prueba de integración IoT: simulador → broker MQTT → adaptador → base de datos
// Usa un broker MQTT en memoria (aedes) para no depender de Mosquitto en la prueba.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import net from 'node:net';
import mqtt from 'mqtt';
import * as aedesPkg from 'aedes';

// aedes cambió su forma de crear el broker entre versiones; se aceptan ambas.
async function crearBroker() {
  const clase = aedesPkg.Aedes ?? aedesPkg.default?.Aedes;
  if (clase?.createBroker) return clase.createBroker();
  const fabrica = aedesPkg.default ?? aedesPkg;
  return fabrica();
}
import { prepararEntorno } from './ayuda.js';
import { iniciarAdaptadorIoT } from '../src/iot/adaptador.js';

let ctx;
let broker;
let servidor;
let adaptador;
let puerto;
const silencioso = { log: () => {}, warn: () => {}, error: () => {} };

const esperar = (emisor, evento, ms = 10000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`No llegó «${evento}» en ${ms} ms`)), ms);
    emisor.once(evento, (dato) => {
      clearTimeout(t);
      resolve(dato);
    });
  });

beforeEach(async () => {
  ctx = await prepararEntorno();
  broker = await crearBroker();
  servidor = net.createServer(broker.handle);
  await new Promise((resolve) => servidor.listen(0, resolve));
  puerto = servidor.address().port;
  adaptador = iniciarAdaptadorIoT({ pool: ctx.pool, url: `mqtt://127.0.0.1:${puerto}`, registro: silencioso });
  await esperar(adaptador, 'connect');
  await new Promise((r) => setTimeout(r, 200)); // da tiempo a que se registre la suscripción
});

afterEach(async () => {
  await adaptador.endAsync();
  await new Promise((resolve) => broker.close(resolve));
  await new Promise((resolve) => servidor.close(resolve));
  await ctx.pool.end();
});

describe('T1.14 · Integración IoT por MQTT', () => {
  it('CP-04-07 · una lectura publicada por MQTT pone el sensor «En línea» en menos de 10 s', async () => {
    const tecnico = await ctx.iniciarSesion('tecnico@agroriego.test');
    await tecnico
      .post('/api/dispositivos/vincular')
      .send({ codigo: 'HS-0161', parcelaId: ctx.semilla.parcelas['La Noria'] });

    const simulador = await mqtt.connectAsync(`mqtt://127.0.0.1:${puerto}`);
    const inicio = Date.now();
    const procesada = esperar(adaptador, 'lectura-procesada');
    await simulador.publishAsync('agroriego/lecturas/HS-0161', JSON.stringify({ humedad: 41, temperatura: 29, bateria: 95 }), { qos: 1 });
    const resultado = await procesada;
    await simulador.endAsync();

    expect(resultado).toMatchObject({ codigo: 'HS-0161', descartada: false });
    expect(Date.now() - inicio).toBeLessThan(10000);
    const { rows } = await ctx.pool.query("SELECT estado, bateria FROM dispositivos WHERE codigo = 'HS-0161'");
    expect(rows[0]).toEqual({ estado: 'EN_LINEA', bateria: 95 });
  });

  it('CP-04-09 · una lectura MQTT de un equipo sin vincular se descarta', async () => {
    const simulador = await mqtt.connectAsync(`mqtt://127.0.0.1:${puerto}`);
    const procesada = esperar(adaptador, 'lectura-procesada');
    await simulador.publishAsync('agroriego/lecturas/HS-0162', JSON.stringify({ humedad: 30 }), { qos: 1 });
    const resultado = await procesada;
    await simulador.endAsync();
    expect(resultado.descartada).toBe(true);
    const { rows } = await ctx.pool.query("SELECT estado FROM dispositivos WHERE codigo = 'HS-0162'");
    expect(rows[0].estado).toBe('SIN_VINCULAR');
  });
});
