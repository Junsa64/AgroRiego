// Módulo de dispositivos · HU-04 (T1.12) y procesamiento de lecturas (T1.11)
import { Router } from 'express';
import { requiereRol } from './autenticacion.js';

const aJson = (d) => ({
  id: d.id,
  codigo: d.codigo,
  tipo: d.tipo,
  estado: d.estado,
  bateria: d.bateria,
  ultimaLectura: d.ultima_lectura,
  parcelaId: d.parcela_id,
  parcela: d.parcela_nombre ?? null,
});

const normalizarCodigo = (codigo) => String(codigo ?? '').trim().toUpperCase();

export function rutasDispositivos({ pool }) {
  const router = Router();
  router.use(requiereRol('TECNICO', 'ADMIN'));

  router.get('/', async (_req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT d.*, p.nombre AS parcela_nombre FROM dispositivos d
         LEFT JOIN parcelas p ON p.id = d.parcela_id ORDER BY d.codigo`,
      );
      res.json({ dispositivos: rows.map(aJson) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/vincular', async (req, res, next) => {
    try {
      const codigo = normalizarCodigo(req.body?.codigo);
      const parcelaId = Number(req.body?.parcelaId);
      if (!codigo) return res.status(400).json({ error: 'Captura o escanea el código del equipo' });
      if (!parcelaId) return res.status(400).json({ error: 'Elige la parcela' });

      const parcela = (await pool.query('SELECT id, nombre FROM parcelas WHERE id = $1', [parcelaId])).rows[0];
      if (!parcela) return res.status(404).json({ error: 'No encontramos esa parcela' });

      const { rows } = await pool.query(
        `SELECT d.*, p.nombre AS parcela_nombre FROM dispositivos d
         LEFT JOIN parcelas p ON p.id = d.parcela_id WHERE d.codigo = $1`,
        [codigo],
      );
      const dispositivo = rows[0];
      if (!dispositivo) return res.status(404).json({ error: 'No encontramos ese equipo' });

      if (dispositivo.parcela_id && dispositivo.parcela_id !== parcela.id) {
        return res
          .status(409)
          .json({ error: `Este equipo ya está vinculado a ${dispositivo.parcela_nombre}` });
      }
      if (dispositivo.parcela_id === parcela.id) {
        return res.json({
          mensaje: `${codigo} ya estaba vinculado a ${parcela.nombre}`,
          dispositivo: aJson(dispositivo),
        });
      }

      const actualizado = (
        await pool.query(
          `UPDATE dispositivos SET parcela_id = $2, estado = 'ESPERANDO_LECTURA', vinculado_en = now()
           WHERE id = $1 RETURNING *`,
          [dispositivo.id, parcela.id],
        )
      ).rows[0];
      res.json({
        mensaje: `${codigo} vinculado a ${parcela.nombre}`,
        dispositivo: aJson({ ...actualizado, parcela_nombre: parcela.nombre }),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// Procesa una lectura recibida por MQTT. Solo se aceptan equipos vinculados a una parcela.
export async function procesarLectura(pool, codigo, datos, { registro = console } = {}) {
  const codigoNorm = normalizarCodigo(codigo);
  const { rows } = await pool.query('SELECT * FROM dispositivos WHERE codigo = $1', [codigoNorm]);
  const dispositivo = rows[0];
  if (!dispositivo || !dispositivo.parcela_id) {
    registro.warn?.(`Lectura descartada: ${codigoNorm} no está vinculado a ninguna parcela`);
    return { descartada: true };
  }
  const humedad = Number.isFinite(datos?.humedad) ? datos.humedad : null;
  const temperatura = Number.isFinite(datos?.temperatura) ? datos.temperatura : null;
  const bateria = Number.isFinite(datos?.bateria) ? Math.round(datos.bateria) : null;

  await pool.query(
    'INSERT INTO lecturas (dispositivo_id, humedad, temperatura, bateria) VALUES ($1, $2, $3, $4)',
    [dispositivo.id, humedad, temperatura, bateria],
  );
  await pool.query(
    `UPDATE dispositivos SET estado = 'EN_LINEA', ultima_lectura = now(),
     bateria = COALESCE($2, bateria) WHERE id = $1`,
    [dispositivo.id, bateria],
  );
  return { descartada: false, dispositivoId: dispositivo.id };
}
