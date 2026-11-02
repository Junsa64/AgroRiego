// HU-03 · Registrar parcela — casos CP-03-xx del diseño de pruebas del Sprint 1
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prepararEntorno } from './ayuda.js';

let ctx;
let productor;
beforeEach(async () => {
  ctx = await prepararEntorno();
  productor = await ctx.iniciarSesion('productor@agroriego.test');
});
afterEach(async () => {
  await ctx.pool.end();
});

const carrizal = { nombre: 'El Carrizal', superficieHa: 6.5, cultivo: 'Maíz', latitud: 27.0789, longitud: -109.4402 };
const sin = (campo) => {
  const copia = { ...carrizal };
  delete copia[campo];
  return copia;
};

describe('HU-03 · Registrar parcela', () => {
  it('CP-03-01 · registro completo: la parcela aparece en el panel del productor', async () => {
    const res = await productor.post('/api/parcelas').send(carrizal);
    expect(res.status).toBe(201);
    expect(res.body.parcela).toMatchObject({ nombre: 'El Carrizal', superficieHa: 6.5, cultivo: 'Maíz' });
    const lista = await productor.get('/api/parcelas');
    expect(lista.body.parcelas.map((p) => p.nombre)).toContain('El Carrizal');
  });

  it('CP-03-02 · sin nombre no se guarda y se marca el campo', async () => {
    const res = await productor.post('/api/parcelas').send(sin('nombre'));
    expect(res.status).toBe(400);
    expect(res.body.campos.nombre).toBe('Captura el nombre de la parcela');
    const blanco = await productor.post('/api/parcelas').send({ ...carrizal, nombre: '   ' });
    expect(blanco.status).toBe(400);
  });

  it('CP-03-03 · sin superficie no se guarda y se pide la superficie', async () => {
    const res = await productor.post('/api/parcelas').send(sin('superficieHa'));
    expect(res.status).toBe(400);
    expect(res.body.campos.superficieHa).toBe('Captura la superficie en hectáreas para guardar');
  });

  it('CP-03-04 · sin ubicación no se guarda y se pide marcar el mapa', async () => {
    const res = await productor.post('/api/parcelas').send(sin('latitud'));
    expect(res.status).toBe(400);
    expect(res.body.campos.latitud).toBe('Marca la ubicación en el mapa');
  });

  it('CP-03-05 · superficie 0 o negativa se rechaza', async () => {
    for (const superficieHa of [0, -3]) {
      const res = await productor.post('/api/parcelas').send({ ...carrizal, superficieHa });
      expect(res.status).toBe(400);
      expect(res.body.campos.superficieHa).toBe('La superficie debe ser mayor a 0');
    }
  });

  it('CP-03-06 · superficie no numérica responde 400 y no crea el registro', async () => {
    const res = await productor.post('/api/parcelas').send({ ...carrizal, superficieHa: 'seis' });
    expect(res.status).toBe(400);
    expect(res.body.campos.superficieHa).toBeDefined();
    const { rows } = await ctx.pool.query("SELECT count(*)::int AS n FROM parcelas WHERE nombre = 'El Carrizal'");
    expect(rows[0].n).toBe(0);
  });

  it('CP-03-07 · límite: superficie de 0.1 ha se acepta', async () => {
    const res = await productor.post('/api/parcelas').send({ ...carrizal, superficieHa: 0.1 });
    expect(res.status).toBe(201);
    expect(res.body.parcela.superficieHa).toBe(0.1);
  });

  it('CP-03-08 · coordenadas fuera de rango responden 400', async () => {
    const res = await productor.post('/api/parcelas').send({ ...carrizal, latitud: 91 });
    expect(res.status).toBe(400);
    expect(res.body.campos.latitud).toBe('Latitud fuera de rango');
  });

  it('CP-03-09 · editar superficie y cultivo se refleja de inmediato', async () => {
    const { body } = await productor.post('/api/parcelas').send(carrizal);
    const res = await productor.put(`/api/parcelas/${body.parcela.id}`).send({ ...carrizal, superficieHa: 7, cultivo: 'Trigo' });
    expect(res.status).toBe(200);
    const lista = await productor.get('/api/parcelas');
    expect(lista.body.parcelas.find((p) => p.id === body.parcela.id)).toMatchObject({ superficieHa: 7, cultivo: 'Trigo' });
  });

  it('CP-03-10 · editar dejando el nombre vacío no guarda y conserva el anterior', async () => {
    const { body } = await productor.post('/api/parcelas').send(carrizal);
    const res = await productor.put(`/api/parcelas/${body.parcela.id}`).send({ ...carrizal, nombre: '' });
    expect(res.status).toBe(400);
    const actual = await productor.get(`/api/parcelas/${body.parcela.id}`);
    expect(actual.body.parcela.nombre).toBe('El Carrizal');
  });

  it('CP-03-11 · un productor no ve ni edita parcelas de otro', async () => {
    const otro = await ctx.iniciarSesion('productor2@agroriego.test');
    const lista = await otro.get('/api/parcelas');
    expect(lista.status).toBe(200);
    expect(lista.body.parcelas).toHaveLength(0);
    const mezquite = ctx.semilla.parcelas['El Mezquite'];
    expect((await otro.get(`/api/parcelas/${mezquite}`)).status).toBe(404);
    expect((await otro.put(`/api/parcelas/${mezquite}`).send(carrizal)).status).toBe(404);
  });
});
