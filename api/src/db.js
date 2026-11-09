// Acceso a datos: única puerta a PostgreSQL (ver arquitectura, componente «Acceso a datos»).
import pg from 'pg';

// NUMERIC llega como texto por defecto; lo convertimos a número.
pg.types.setTypeParser(1700, (valor) => (valor === null ? null : Number(valor)));

export function crearPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('Falta la variable DATABASE_URL');
  }
  return new pg.Pool({ connectionString });
}
