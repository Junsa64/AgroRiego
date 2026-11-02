// Módulo de autenticación · HU-01 (T1.4)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { z } from 'zod';

export const MAX_INTENTOS = 5;
export const MINUTOS_BLOQUEO = 15;
const MINUTOS_ENLACE = 60;
const COOKIE = 'sesion';
const MSG_INCORRECTOS = 'Correo o contraseña incorrectos';
const MSG_BLOQUEADA = `Cuenta bloqueada. Intenta en ${MINUTOS_BLOQUEO} minutos`;

const esquemaLogin = z.object({
  correo: z.string().trim().min(1),
  contrasena: z.string().min(1),
});

const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

const usuarioPublico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol });

export function middlewareSesion({ secreto }) {
  return (req, _res, next) => {
    const token = req.cookies?.[COOKIE];
    if (token) {
      try {
        const datos = jwt.verify(token, secreto);
        req.usuario = { id: Number(datos.sub), rol: datos.rol, nombre: datos.nombre };
      } catch {
        req.usuario = undefined;
      }
    }
    next();
  };
}

export function requiereSesion(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión para continuar' });
  next();
}

export const requiereRol = (...roles) => (req, res, next) => {
  if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión para continuar' });
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};

export function rutasAutenticacion({ pool, secreto, now, enviarCorreo, urlApp, produccion }) {
  const router = Router();

  const abrirSesion = (res, usuario) => {
    const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol, nombre: usuario.nombre }, secreto, {
      expiresIn: '8h',
    });
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: produccion,
      maxAge: 8 * 60 * 60 * 1000,
    });
  };

  router.post('/login', async (req, res, next) => {
    try {
      const datos = esquemaLogin.safeParse(req.body ?? {});
      if (!datos.success) {
        return res.status(400).json({ error: 'Captura tu correo y tu contraseña' });
      }
      const correo = datos.data.correo.toLowerCase();
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
      const usuario = rows[0];
      const ahora = now();

      if (!usuario) {
        // Misma respuesta que con contraseña incorrecta: no se revela si el correo existe.
        return res.status(401).json({ error: MSG_INCORRECTOS });
      }

      if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > ahora) {
        return res.status(423).json({ error: MSG_BLOQUEADA });
      }

      const correcta = await bcrypt.compare(datos.data.contrasena, usuario.hash_contrasena);
      if (!correcta) {
        const intentos = usuario.intentos_fallidos + 1;
        if (intentos >= MAX_INTENTOS) {
          const hasta = new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60 * 1000);
          await pool.query(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = $2, actualizado_en = now() WHERE id = $1',
            [usuario.id, hasta],
          );
          return res.status(423).json({ error: MSG_BLOQUEADA });
        }
        await pool.query(
          'UPDATE usuarios SET intentos_fallidos = $2, actualizado_en = now() WHERE id = $1',
          [usuario.id, intentos],
        );
        return res.status(401).json({ error: MSG_INCORRECTOS });
      }

      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, actualizado_en = now() WHERE id = $1',
        [usuario.id],
      );
      abrirSesion(res, usuario);
      return res.json({ usuario: usuarioPublico(usuario) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(COOKIE);
    res.status(204).end();
  });

  router.get('/yo', requiereSesion, async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
      if (!rows[0]) return res.status(401).json({ error: 'Inicia sesión para continuar' });
      res.json({ usuario: usuarioPublico(rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/olvide', async (req, res, next) => {
    const respuesta = { mensaje: 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña' };
    try {
      const correo = String(req.body?.correo ?? '').trim().toLowerCase();
      if (!correo) return res.status(400).json({ error: 'Captura tu correo' });
      const { rows } = await pool.query('SELECT id, correo FROM usuarios WHERE correo = $1', [correo]);
      if (rows[0]) {
        const token = crypto.randomBytes(32).toString('hex');
        const expira = new Date(now().getTime() + MINUTOS_ENLACE * 60 * 1000);
        await pool.query(
          'INSERT INTO tokens_restablecimiento (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3)',
          [rows[0].id, sha256(token), expira],
        );
        await enviarCorreo({
          para: rows[0].correo,
          asunto: 'Restablece tu contraseña de AgroRiego',
          enlace: `${urlApp}/restablecer?token=${token}`,
        });
      }
      res.json(respuesta);
    } catch (error) {
      next(error);
    }
  });

  router.post('/restablecer', async (req, res, next) => {
    try {
      const token = String(req.body?.token ?? '');
      const contrasena = String(req.body?.contrasena ?? '');
      if (contrasena.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      }
      const { rows } = await pool.query(
        `SELECT * FROM tokens_restablecimiento
         WHERE token_hash = $1 AND usado = false AND expira_en > $2`,
        [sha256(token), now()],
      );
      if (!rows[0]) return res.status(400).json({ error: 'El enlace ya no es válido' });

      const hash = await bcrypt.hash(contrasena, Number(process.env.BCRYPT_ROUNDS ?? 10));
      await pool.query(
        `UPDATE usuarios SET hash_contrasena = $2, intentos_fallidos = 0, bloqueado_hasta = NULL,
         actualizado_en = now() WHERE id = $1`,
        [rows[0].usuario_id, hash],
      );
      await pool.query('UPDATE tokens_restablecimiento SET usado = true WHERE id = $1', [rows[0].id]);
      res.json({ mensaje: 'Tu contraseña se actualizó. Ya puedes iniciar sesión' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
