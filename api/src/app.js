// Composición de la API (monolito modular). Las dependencias se inyectan para poder probar.
import express from 'express';
import cookieParser from 'cookie-parser';
import { middlewareSesion, rutasAutenticacion } from './modulos/autenticacion.js';
import { rutasParcelas } from './modulos/parcelas.js';
import { rutasDispositivos } from './modulos/dispositivos.js';

export function crearApp({
  pool,
  secreto = process.env.JWT_SECRETO,
  now = () => new Date(),
  enviarCorreo = async ({ para, enlace }) => console.log(`[correo] Enlace de restablecimiento para ${para}: ${enlace}`),
  urlApp = process.env.URL_APP ?? 'http://localhost:5173',
  // La cookie «secure» solo funciona por HTTPS; en el ambiente de pruebas por HTTP queda en false.
  produccion = process.env.COOKIE_SEGURA === 'true',
} = {}) {
  if (!secreto) throw new Error('Falta la variable JWT_SECRETO');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(middlewareSesion({ secreto }));

  app.get('/api/salud', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', rutasAutenticacion({ pool, secreto, now, enviarCorreo, urlApp, produccion }));
  app.use('/api/parcelas', rutasParcelas({ pool }));
  app.use('/api/dispositivos', rutasDispositivos({ pool }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // JSON mal formado y errores inesperados
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
    }
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error inesperado' });
  });

  return app;
}
