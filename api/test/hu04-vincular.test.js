// HU-04 · Vincular sensor y válvula — casos CP-04-xx del diseño de pruebas del Sprint 1
// CP-04-07 también se prueba de punta a punta por MQTT en iot-mqtt.test.js (T1.14).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prepararEntorno } from './ayuda.js';
import { procesarLectura } from '../src/modulos/dispositivos.js';

let ctx;
let tecnico;
let carrizalId;
const silencioso = { warn: () => {} };

beforeEach(async () => {
  ctx = await prepararEntorno();
  const productor = await ctx.iniciarSesion('productor@agroriego.test');
  const { body } = await productor
    .post('/api/parcelas')
    .send({ nombre: 'El Carrizal', superficieHa: 6.5, cultivo: 'Maíz', latitud: 27.0789, longitud: -109.4402 });
  carrizalId = body.parcela.id;
  tecnico = await ctx.iniciarSesion('tecnico@agroriego.test');
});
afterEach(async () => {
  await ctx.pool.end();
});

const estado = async (codigo) =>
  (await ctx.pool.query('SELECT estado, parcela_id FROM dispositivos WHERE codigo = $1', [codigo])).rows[0];

describe('HU-04 · Vincular sensor y válvula', () => {
  it('CP-04-01 · vincular sensor capturando el código', async () => {
    const res = await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'HS-0161', parcelaId: carrizalId });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('HS-0161 vinculado a El Carrizal');
    expect(res.body.dispositivo.estado).toBe('ESPERANDO_LECTURA');
  });

  it('CP-04-02 · el código leído del QR (con espacios o minúsculas) se normaliza y vincula', async () => {
    const laNoria = ctx.semilla.parcelas['La Noria'];
    const res = await tecnico.post('/api/dispositivos/vincular').send({ codigo: ' hs-0162 \n', parcelaId: laNoria });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('HS-0162 vinculado a La Noria');
  });

  it('CP-04-03 · vincular válvula: aparece en la lista ligada a la parcela', async () => {
    await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'VL-0040', parcelaId: carrizalId });
    const lista = await tecnico.get('/api/dispositivos');
    expect(lista.body.dispositivos.find((d) => d.codigo === 'VL-0040')).toMatchObject({ tipo: 'VALVULA', parcela: 'El Carrizal' });
  });

  it('CP-04-04 · código ya vinculado a otra parcela: 409 con aviso y sin cambios', async () => {
    const alamos = ctx.semilla.parcelas['Los Álamos'];
    const res = await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'HS-0142', parcelaId: alamos });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Este equipo ya está vinculado a El Mezquite');
    expect((await estado('HS-0142')).parcela_id).toBe(ctx.semilla.parcelas['El Mezquite']);
  });

  it('CP-04-05 · código inexistente: aviso y no se vincula', async () => {
    const res = await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'HS-9999', parcelaId: carrizalId });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No encontramos ese equipo');
  });

  it('CP-04-06 · un productor no puede vincular equipos (403)', async () => {
    const productor = await ctx.iniciarSesion('productor@agroriego.test');
    const res = await productor.post('/api/dispositivos/vincular').send({ codigo: 'HS-0161', parcelaId: carrizalId });
    expect(res.status).toBe(403);
    expect((await estado('HS-0161')).estado).toBe('SIN_VINCULAR');
  });

  it('CP-04-07 · la primera lectura cambia el estado a EN_LINEA y se guarda', async () => {
    await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'HS-0161', parcelaId: carrizalId });
    const r = await procesarLectura(ctx.pool, 'HS-0161', { humedad: 41, temperatura: 29, bateria: 95 }, { registro: silencioso });
    expect(r.descartada).toBe(false);
    expect((await estado('HS-0161')).estado).toBe('EN_LINEA');
    const { rows } = await ctx.pool.query('SELECT humedad, temperatura, bateria FROM lecturas WHERE dispositivo_id = $1', [r.dispositivoId]);
    expect(rows).toEqual([{ humedad: 41, temperatura: 29, bateria: 95 }]);
  });

  it('CP-04-08 · sin lecturas el sensor permanece en ESPERANDO_LECTURA', async () => {
    const laNoria = ctx.semilla.parcelas['La Noria'];
    await tecnico.post('/api/dispositivos/vincular').send({ codigo: 'HS-0162', parcelaId: laNoria });
    expect((await estado('HS-0162')).estado).toBe('ESPERANDO_LECTURA');
  });

  it('CP-04-09 · la lectura de un equipo no vinculado se descarta y ninguna parcela cambia', async () => {
    const avisos = [];
    const r = await procesarLectura(ctx.pool, 'HS-0162', { humedad: 30 }, { registro: { warn: (m) => avisos.push(m) } });
    expect(r.descartada).toBe(true);
    expect(avisos[0]).toMatch(/descartada/);
    expect((await estado('HS-0162')).estado).toBe('SIN_VINCULAR');
    const { rows } = await ctx.pool.query('SELECT count(*)::int AS n FROM lecturas');
    expect(rows[0].n).toBe(0);
  });
});
