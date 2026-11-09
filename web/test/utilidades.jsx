// Monta la app en una ruta y simula la API con respuestas por método y ruta.
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../src/App.jsx';
import { ProveedorSesion } from '../src/sesion.jsx';

export const PRODUCTOR = { id: 1, nombre: 'Productor de prueba', correo: 'productor@agroriego.test', rol: 'PRODUCTOR' };
export const TECNICO = { id: 3, nombre: 'Técnico de prueba', correo: 'tecnico@agroriego.test', rol: 'TECNICO' };

const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  json: async () => cuerpo,
});

// rutas: { 'GET /auth/yo': [200, {...}] | (opciones) => [estado, cuerpo] }
export function simularApi(rutas) {
  const llamadas = [];
  const fetchSimulado = vi.fn(async (url, opciones = {}) => {
    const metodo = opciones.method ?? 'GET';
    const ruta = url.replace(/^\/api/, '');
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined;
    llamadas.push({ metodo, ruta, cuerpo });
    const manejador = rutas[`${metodo} ${ruta}`];
    if (!manejador) return respuesta(404, { error: 'Ruta no simulada' });
    const [estado, datos] = typeof manejador === 'function' ? manejador(cuerpo) : manejador;
    return respuesta(estado, datos);
  });
  vi.stubGlobal('fetch', fetchSimulado);
  return { fetchSimulado, llamadas };
}

export const sinSesion = { 'GET /auth/yo': [401, { error: 'Inicia sesión para continuar' }] };
export const conSesion = (usuario) => ({ 'GET /auth/yo': [200, { usuario }] });

export function montar(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </MemoryRouter>,
  );
}
