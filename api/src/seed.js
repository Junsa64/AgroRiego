// Datos semilla del ambiente de pruebas (ver «Ambiente y datos de prueba» en el diseño de pruebas).
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { crearPool } from './db.js';

export const CONTRASENA_SEMILLA = 'Prueba#2026';

export async function sembrar(pool, { rondas = Number(process.env.BCRYPT_ROUNDS ?? 10) } = {}) {
  const hash = await bcrypt.hash(CONTRASENA_SEMILLA, rondas);

  const usuarios = [
    ['Productor de prueba', 'productor@agroriego.test', 'PRODUCTOR'],
    ['Segundo productor', 'productor2@agroriego.test', 'PRODUCTOR'],
    ['Técnico de prueba', 'tecnico@agroriego.test', 'TECNICO'],
  ];
  const ids = {};
  for (const [nombre, correo, rol] of usuarios) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, hash_contrasena, rol)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`,
      [nombre, correo, hash, rol],
    );
    ids[correo] = rows[0].id;
  }

  const productor = ids['productor@agroriego.test'];
  const parcelas = [
    ['El Mezquite', 12, 'Trigo', 27.0712, -109.4431],
    ['Los Álamos', 5.5, 'Garbanzo', 27.0821, -109.4512],
    ['La Noria', 8, 'Maíz', 27.0655, -109.4389],
    ['San Ignacio', 3, 'Hortalizas', 27.0903, -109.4298],
  ];
  const parcelaIds = {};
  for (const [nombre, superficie, cultivo, lat, lng] of parcelas) {
    const existente = await pool.query(
      'SELECT id FROM parcelas WHERE productor_id = $1 AND nombre = $2',
      [productor, nombre],
    );
    if (existente.rows[0]) {
      parcelaIds[nombre] = existente.rows[0].id;
      continue;
    }
    const { rows } = await pool.query(
      `INSERT INTO parcelas (productor_id, nombre, superficie_ha, cultivo, latitud, longitud)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [productor, nombre, superficie, cultivo, lat, lng],
    );
    parcelaIds[nombre] = rows[0].id;
  }

  // Inventario de equipos: HS-0142 y VL-0031 ya están instalados en El Mezquite.
  const dispositivos = [
    ['HS-0142', 'SENSOR', parcelaIds['El Mezquite'], 'EN_LINEA'],
    ['VL-0031', 'VALVULA', parcelaIds['El Mezquite'], 'EN_LINEA'],
    ['HS-0161', 'SENSOR', null, 'SIN_VINCULAR'],
    ['HS-0162', 'SENSOR', null, 'SIN_VINCULAR'],
    ['VL-0040', 'VALVULA', null, 'SIN_VINCULAR'],
  ];
  for (const [codigo, tipo, parcelaId, estado] of dispositivos) {
    await pool.query(
      `INSERT INTO dispositivos (codigo, tipo, parcela_id, estado, vinculado_en)
       VALUES ($1, $2, $3, $4, CASE WHEN $3::int IS NULL THEN NULL ELSE now() END)
       ON CONFLICT (codigo) DO NOTHING`,
      [codigo, tipo, parcelaId, estado],
    );
  }

  return { usuarios: ids, parcelas: parcelaIds };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = crearPool();
  sembrar(pool)
    .then(() => {
      console.log('Datos semilla cargados');
      return pool.end();
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
