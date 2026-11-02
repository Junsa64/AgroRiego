// Aplica en orden los archivos de api/migrations que aún no se han ejecutado.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { crearPool } from './db.js';

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export async function migrar(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS migraciones (
    nombre TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const { rows } = await pool.query('SELECT nombre FROM migraciones');
  const aplicadas = new Set(rows.map((r) => r.nombre));
  const archivos = (await readdir(carpeta)).filter((a) => a.endsWith('.sql')).sort();

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;
    const sql = await readFile(path.join(carpeta, archivo), 'utf8');
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO migraciones (nombre) VALUES ($1)', [archivo]);
      await cliente.query('COMMIT');
      console.log(`Migración aplicada: ${archivo}`);
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = crearPool();
  migrar(pool)
    .then(() => pool.end())
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
