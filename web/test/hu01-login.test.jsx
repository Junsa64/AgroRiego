// HU-01 · Pantalla de inicio de sesión (P1) — parte de interfaz de los casos CP-01-xx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { montar, simularApi, sinSesion, PRODUCTOR, TECNICO, conSesion } from './utilidades.jsx';

const capturar = async (usuario, correo, contrasena) => {
  await usuario.type(await screen.findByLabelText('Correo electrónico'), correo);
  await usuario.type(screen.getByLabelText('Contraseña'), contrasena);
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }));
};

describe('HU-01 · Pantalla de inicio de sesión', () => {
  it('CP-01-01 · productor con datos correctos llega a su panel de parcelas', async () => {
    simularApi({
      ...sinSesion,
      'POST /auth/login': [200, { usuario: PRODUCTOR }],
      'GET /parcelas': [200, { parcelas: [] }],
    });
    const u = userEvent.setup();
    montar('/login');
    await capturar(u, 'productor@agroriego.test', 'Prueba#2026');
    expect(await screen.findByRole('heading', { name: 'Mis parcelas' })).toBeInTheDocument();
  });

  it('CP-01-02 · técnico con datos correctos llega a la pantalla de Equipos', async () => {
    simularApi({
      ...sinSesion,
      'POST /auth/login': [200, { usuario: TECNICO }],
      'GET /parcelas': [200, { parcelas: [] }],
      'GET /dispositivos': [200, { dispositivos: [] }],
    });
    const u = userEvent.setup();
    montar('/login');
    await capturar(u, 'tecnico@agroriego.test', 'Prueba#2026');
    expect(await screen.findByRole('heading', { name: 'Equipos' })).toBeInTheDocument();
  });

  it('CP-01-03 · con datos incorrectos muestra el mensaje genérico y no entra', async () => {
    simularApi({ ...sinSesion, 'POST /auth/login': [401, { error: 'Correo o contraseña incorrectos' }] });
    const u = userEvent.setup();
    montar('/login');
    await capturar(u, 'productor@agroriego.test', 'Mala123');
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('CP-01-05 · con campos vacíos marca ambos y no llama a la API', async () => {
    const { llamadas } = simularApi({ ...sinSesion });
    const u = userEvent.setup();
    montar('/login');
    await u.click(await screen.findByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Captura tu correo')).toBeInTheDocument();
    expect(screen.getByText('Captura tu contraseña')).toBeInTheDocument();
    expect(llamadas.some((l) => l.ruta === '/auth/login')).toBe(false);
  });

  it('CP-01-06 · cuenta bloqueada muestra el aviso de 15 minutos', async () => {
    simularApi({ ...sinSesion, 'POST /auth/login': [423, { error: 'Cuenta bloqueada. Intenta en 15 minutos' }] });
    const u = userEvent.setup();
    montar('/login');
    await capturar(u, 'productor@agroriego.test', 'Prueba#2026');
    expect(await screen.findByRole('alert')).toHaveTextContent('Cuenta bloqueada. Intenta en 15 minutos');
  });

  it('CP-01-09 · solicitar restablecimiento muestra el mensaje neutro', async () => {
    const mensaje = 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña';
    const { llamadas } = simularApi({ ...sinSesion, 'POST /auth/olvide': [200, { mensaje }] });
    const u = userEvent.setup();
    montar('/login');
    await u.click(await screen.findByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    await u.type(screen.getByLabelText('Correo electrónico'), 'productor@agroriego.test');
    await u.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByRole('status')).toHaveTextContent(mensaje);
    expect(llamadas.find((l) => l.ruta === '/auth/olvide').cuerpo).toEqual({ correo: 'productor@agroriego.test' });
  });

  it('CP-01-10 · la pantalla del enlace guarda la contraseña nueva', async () => {
    const { llamadas } = simularApi({
      ...sinSesion,
      'POST /auth/restablecer': [200, { mensaje: 'Tu contraseña se actualizó. Ya puedes iniciar sesión' }],
    });
    const u = userEvent.setup();
    montar('/restablecer?token=abc123');
    await u.type(await screen.findByLabelText('Contraseña nueva (mínimo 8 caracteres)'), 'Nueva#2026');
    await u.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Tu contraseña se actualizó');
    expect(llamadas.find((l) => l.ruta === '/auth/restablecer').cuerpo).toEqual({ token: 'abc123', contrasena: 'Nueva#2026' });
  });

  it('CP-01-11 · un enlace inválido muestra «El enlace ya no es válido»', async () => {
    simularApi({ ...sinSesion, 'POST /auth/restablecer': [400, { error: 'El enlace ya no es válido' }] });
    const u = userEvent.setup();
    montar('/restablecer?token=usado');
    await u.type(await screen.findByLabelText('Contraseña nueva (mínimo 8 caracteres)'), 'Nueva#2026');
    await u.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace ya no es válido');
  });

  it('CP-01-12 · abrir /panel sin sesión redirige al inicio de sesión', async () => {
    simularApi({ ...sinSesion });
    montar('/panel');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('CP-01-12 · con sesión de técnico, /panel lo regresa a Equipos', async () => {
    simularApi({ ...conSesion(TECNICO), 'GET /parcelas': [200, { parcelas: [] }], 'GET /dispositivos': [200, { dispositivos: [] }] });
    montar('/panel');
    expect(await screen.findByRole('heading', { name: 'Equipos' })).toBeInTheDocument();
  });
});
