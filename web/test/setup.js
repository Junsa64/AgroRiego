import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// El mapa real (Leaflet + teselas de internet) no corre en jsdom: se reemplaza por un botón
// que marca la ubicación como lo haría un toque en el mapa.
vi.mock('../src/componentes/MapaUbicacion.jsx', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ valor, alCambiar }) =>
      createElement(
        'button',
        { type: 'button', onClick: () => alCambiar({ latitud: 27.0789, longitud: -109.4402 }) },
        valor ? `Ubicación marcada ${valor.latitud}, ${valor.longitud}` : 'Marcar en el mapa',
      ),
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
