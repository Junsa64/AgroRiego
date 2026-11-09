// Módulo de parcelas · HU-03 (T1.8)
import { Router } from 'express';
import { z } from 'zod';
import { requiereRol, requiereSesion } from './autenticacion.js';

const esquemaParcela = z.object({
  nombre: z
    .string({ required_error: 'Captura el nombre de la parcela', invalid_type_error: 'Captura el nombre de la parcela' })
    .trim()
    .min(1, 'Captura el nombre de la parcela')
    .max(80, 'El nombre es demasiado largo'),
  superficieHa: z
    .number({
      required_error: 'Captura la superficie en hectáreas para guardar',
      invalid_type_error: 'La superficie debe ser un número',
    })
    .positive('La superficie debe ser mayor a 0')
    .max(100000, 'La superficie es demasiado grande'),
  cultivo: z
    .string({ required_error: 'Elige el cultivo', invalid_type_error: 'Elige el cultivo' })
    .trim()
    .min(1, 'Elige el cultivo'),
  latitud: z
    .number({ required_error: 'Marca la ubicación en el mapa', invalid_type_error: 'Marca la ubicación en el mapa' })
    .min(-90, 'Latitud fuera de rango')
    .max(90, 'Latitud fuera de rango'),
  longitud: z
    .number({ required_error: 'Marca la ubicación en el mapa', invalid_type_error: 'Marca la ubicación en el mapa' })
    .min(-180, 'Longitud fuera de rango')
    .max(180, 'Longitud fuera de rango'),
});

export function validarParcela(body) {
  const resultado = esquemaParcela.safeParse(body ?? {});
  if (resultado.success) return { datos: resultado.data };
  const campos = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0];
    if (campo && !campos[campo]) campos[campo] = problema.message;
  }
  return { campos };
}

const aJson = (p) => ({
  id: p.id,
  nombre: p.nombre,
  superficieHa: p.superficie_ha,
  cultivo: p.cultivo,
  latitud: p.latitud,
  longitud: p.longitud,
  umbralHumedad: p.umbral_humedad,
  humedadObjetivo: p.humedad_objetivo,
  ...(p.productor_nombre ? { productor: p.productor_nombre } : {}),
});

export function rutasParcelas({ pool }) {
  const router = Router();
  router.use(requiereSesion);

  // El productor ve solo sus parcelas; el técnico ve todas para poder vincular equipos.
  router.get('/', async (req, res, next) => {
    try {
      const { rows } =
        req.usuario.rol === 'PRODUCTOR'
          ? await pool.query('SELECT * FROM parcelas WHERE productor_id = $1 ORDER BY nombre', [req.usuario.id])
          : await pool.query(
              `SELECT p.*, u.nombre AS productor_nombre FROM parcelas p
               JOIN usuarios u ON u.id = p.productor_id ORDER BY p.nombre`,
            );
      res.json({ parcelas: rows.map(aJson) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', requiereRol('PRODUCTOR'), async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM parcelas WHERE id = $1 AND productor_id = $2', [
        Number(req.params.id) || 0,
        req.usuario.id,
      ]);
      if (!rows[0]) return res.status(404).json({ error: 'No encontramos esa parcela' });
      res.json({ parcela: aJson(rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', requiereRol('PRODUCTOR'), async (req, res, next) => {
    try {
      const { datos, campos } = validarParcela(req.body);
      if (campos) return res.status(400).json({ error: 'Revisa los campos marcados', campos });
      const { rows } = await pool.query(
        `INSERT INTO parcelas (productor_id, nombre, superficie_ha, cultivo, latitud, longitud)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.usuario.id, datos.nombre, datos.superficieHa, datos.cultivo, datos.latitud, datos.longitud],
      );
      res.status(201).json({ parcela: aJson(rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', requiereRol('PRODUCTOR'), async (req, res, next) => {
    try {
      const { datos, campos } = validarParcela(req.body);
      if (campos) return res.status(400).json({ error: 'Revisa los campos marcados', campos });
      const { rows } = await pool.query(
        `UPDATE parcelas SET nombre = $3, superficie_ha = $4, cultivo = $5, latitud = $6, longitud = $7,
         actualizado_en = now()
         WHERE id = $1 AND productor_id = $2 RETURNING *`,
        [
          Number(req.params.id) || 0,
          req.usuario.id,
          datos.nombre,
          datos.superficieHa,
          datos.cultivo,
          datos.latitud,
          datos.longitud,
        ],
      );
      if (!rows[0]) return res.status(404).json({ error: 'No encontramos esa parcela' });
      res.json({ parcela: aJson(rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
