// HU-01 · Iniciar sesión — casos CP-01-xx del diseño de pruebas del Sprint 1
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prepararEntorno, avanzarMinutos, CONTRASENA_SEMILLA } from './ayuda.js';

let ctx;
beforeEach(async () => {
  ctx = await prepararEntorno();
});
afterEach(async () => {
  await ctx.pool.end();
});

const login = (correo, contrasena) => request(ctx.app).post('/api/auth/login').send({ correo, contrasena });
const PRODUCTOR = 'productor@agroriego.test';

describe('HU-01 · Iniciar sesión', () => {
  it('CP-01-01 · productor entra con datos correctos y recibe su sesión', async () => {
    const res = await login(PRODUCTOR, CONTRASENA_SEMILLA);
    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ correo: PRODUCTOR, rol: 'PRODUCTOR', nombre: 'Productor de prueba' });
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/sesion=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('CP-01-02 · técnico entra con datos correctos y su rol es TECNICO', async () => {
    const res = await login('tecnico@agroriego.test', CONTRASENA_SEMILLA);
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('TECNICO');
  });

  it('CP-01-03 · contraseña incorrecta devuelve el mensaje genérico', async () => {
    const res = await login(PRODUCTOR, 'Mala123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Correo o contraseña incorrectos');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('CP-01-04 · correo no registrado devuelve el mismo mensaje genérico', async () => {
    const res = await login('noexiste@agroriego.test', CONTRASENA_SEMILLA);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Correo o contraseña incorrectos');
  });

  it('CP-01-05 · campos vacíos se rechazan sin consultar credenciales', async () => {
    const res = await login('', '');
    expect(res.status).toBe(400);
  });

  it('CP-01-06 · tras 5 intentos fallidos la cuenta se bloquea, incluso con la contraseña correcta', async () => {
    for (let i = 1; i <= 4; i += 1) {
      expect((await login(PRODUCTOR, 'Mala123')).status).toBe(401);
    }
    const quinto = await login(PRODUCTOR, 'Mala123');
    expect(quinto.status).toBe(423);
    expect(quinto.body.error).toBe('Cuenta bloqueada. Intenta en 15 minutos');

    const sexto = await login(PRODUCTOR, CONTRASENA_SEMILLA);
    expect(sexto.status).toBe(423);
    expect(sexto.body.error).toBe('Cuenta bloqueada. Intenta en 15 minutos');
  });

  it('CP-01-07 · al pasar 15 minutos se desbloquea y el contador vuelve a 0', async () => {
    for (let i = 0; i < 5; i += 1) await login(PRODUCTOR, 'Mala123');
    expect((await login(PRODUCTOR, CONTRASENA_SEMILLA)).status).toBe(423);

    avanzarMinutos(ctx.reloj, 15.1);
    const res = await login(PRODUCTOR, CONTRASENA_SEMILLA);
    expect(res.status).toBe(200);
    const { rows } = await ctx.pool.query('SELECT intentos_fallidos, bloqueado_hasta FROM usuarios WHERE correo = $1', [PRODUCTOR]);
    expect(rows[0].intentos_fallidos).toBe(0);
    expect(rows[0].bloqueado_hasta).toBeNull();
  });

  it('CP-01-08 · 4 fallos y luego acierto: entra sin bloqueo y el contador vuelve a 0', async () => {
    for (let i = 0; i < 4; i += 1) await login(PRODUCTOR, 'Mala123');
    const res = await login(PRODUCTOR, CONTRASENA_SEMILLA);
    expect(res.status).toBe(200);
    const { rows } = await ctx.pool.query('SELECT intentos_fallidos FROM usuarios WHERE correo = $1', [PRODUCTOR]);
    expect(rows[0].intentos_fallidos).toBe(0);
  });

  it('CP-01-09 · solicitar restablecimiento da un mensaje neutro y genera el enlace', async () => {
    const existe = await request(ctx.app).post('/api/auth/olvide').send({ correo: PRODUCTOR });
    const noExiste = await request(ctx.app).post('/api/auth/olvide').send({ correo: 'noexiste@agroriego.test' });
    expect(existe.status).toBe(200);
    expect(noExiste.status).toBe(200);
    expect(existe.body.mensaje).toBe(noExiste.body.mensaje);
    expect(ctx.correos).toHaveLength(1);
    expect(ctx.correos[0].para).toBe(PRODUCTOR);
    expect(ctx.correos[0].enlace).toMatch(/^http:\/\/localhost:5173\/restablecer\?token=[0-9a-f]{64}$/);
  });

  it('CP-01-10 · restablecer con enlace válido: entra con la nueva y la anterior ya no sirve', async () => {
    await request(ctx.app).post('/api/auth/olvide').send({ correo: PRODUCTOR });
    const token = new URL(ctx.correos[0].enlace).searchParams.get('token');
    const res = await request(ctx.app).post('/api/auth/restablecer').send({ token, contrasena: 'Nueva#2026' });
    expect(res.status).toBe(200);
    expect((await login(PRODUCTOR, 'Nueva#2026')).status).toBe(200);
    expect((await login(PRODUCTOR, CONTRASENA_SEMILLA)).status).toBe(401);
  });

  it('CP-01-11 · enlace ya usado o vencido se rechaza y la contraseña no cambia', async () => {
    await request(ctx.app).post('/api/auth/olvide').send({ correo: PRODUCTOR });
    const token = new URL(ctx.correos[0].enlace).searchParams.get('token');
    await request(ctx.app).post('/api/auth/restablecer').send({ token, contrasena: 'Nueva#2026' });
    const reusado = await request(ctx.app).post('/api/auth/restablecer').send({ token, contrasena: 'Otra#2026x' });
    expect(reusado.status).toBe(400);
    expect(reusado.body.error).toBe('El enlace ya no es válido');

    await request(ctx.app).post('/api/auth/olvide').send({ correo: PRODUCTOR });
    const token2 = new URL(ctx.correos[1].enlace).searchParams.get('token');
    avanzarMinutos(ctx.reloj, 61);
    const vencido = await request(ctx.app).post('/api/auth/restablecer').send({ token: token2, contrasena: 'Otra#2026x' });
    expect(vencido.status).toBe(400);
    expect((await login(PRODUCTOR, 'Nueva#2026')).status).toBe(200);
  });

  it('CP-01-12 · las rutas protegidas sin sesión responden 401', async () => {
    expect((await request(ctx.app).get('/api/auth/yo')).status).toBe(401);
    expect((await request(ctx.app).get('/api/parcelas')).status).toBe(401);
    const agente = await ctx.iniciarSesion(PRODUCTOR);
    expect((await agente.get('/api/auth/yo')).status).toBe(200);
    await agente.post('/api/auth/logout');
    expect((await agente.get('/api/auth/yo')).status).toBe(401);
  });

  it('CP-01-13 · la contraseña se guarda como hash bcrypt, nunca en texto', async () => {
    const { rows } = await ctx.pool.query('SELECT hash_contrasena FROM usuarios WHERE correo = $1', [PRODUCTOR]);
    expect(rows[0].hash_contrasena).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(rows[0].hash_contrasena).not.toContain(CONTRASENA_SEMILLA);
  });
});
