// Utilidades de prueba: base de datos limpia con migraciones y semilla, reloj controlable y sesiones.
import request from 'supertest';
import { crearPool } from '../src/db.js';
import { migrar } from '../src/migrate.js';
import { sembrar, CONTRASENA_SEMILLA } from '../src/seed.js';
import { crearApp } from '../src/app.js';

export { CONTRASENA_SEMILLA };

export async function prepararEntorno() {
  const pool = crearPool(process.env.DATABASE_URL);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrar(pool);
  const semilla = await sembrar(pool, { rondas: 4 });

  const reloj = { actual: new Date('2026-11-02T15:00:00Z') };
  const correos = [];
  const app = crearApp({
    pool,
    secreto: 'secreto-de-pruebas',
    now: () => reloj.actual,
    enviarCorreo: async (correo) => {
      correos.push(correo);
    },
    urlApp: 'http://localhost:5173',
  });

  const iniciarSesion = async (correo, contrasena = CONTRASENA_SEMILLA) => {
    const agente = request.agent(app);
    const res = await agente.post('/api/auth/login').send({ correo, contrasena });
    if (res.status !== 200) throw new Error(`No se pudo iniciar sesión como ${correo}: ${res.status}`);
    return agente;
  };

  return { pool, app, reloj, correos, semilla, iniciarSesion };
}

export const avanzarMinutos = (reloj, minutos) => {
  reloj.actual = new Date(reloj.actual.getTime() + minutos * 60 * 1000);
};
