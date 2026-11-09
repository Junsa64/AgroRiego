// HU-04 · Pantalla del técnico (P8) — parte de interfaz de los casos CP-04-xx
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { conSesion, montar, simularApi, TECNICO } from './utilidades.jsx';

// La cámara no existe en jsdom: el escáner se reemplaza por uno que «lee» un QR impreso.
vi.mock('../src/componentes/EscanerQR.jsx', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ alLeer }) => createElement('button', { type: 'button', onClick: () => alLeer('hs-0162') }, 'Simular lectura del QR'),
  };
});

const parcelas = [
  { id: 4, nombre: 'La Noria', productor: 'Productor de prueba' },
  { id: 9, nombre: 'El Carrizal', productor: 'Productor de prueba' },
];
const equipos = [
  { id: 1, codigo: 'HS-0142', tipo: 'SENSOR', estado: 'EN_LINEA', bateria: 82, parcela: 'El Mezquite' },
  { id: 3, codigo: 'HS-0161', tipo: 'SENSOR', estado: 'SIN_VINCULAR', bateria: null, parcela: null },
];

describe('HU-04 · Vincular equipo (interfaz)', () => {
  it('CP-04-01 · capturar código y parcela vincula el equipo y lo muestra esperando lectura', async () => {
    const lista = equipos.map((e) => ({ ...e }));
    const { llamadas } = simularApi({
      ...conSesion(TECNICO),
      'GET /parcelas': [200, { parcelas }],
      'GET /dispositivos': () => [200, { dispositivos: lista }],
      'POST /dispositivos/vincular': () => {
        Object.assign(lista[1], { estado: 'ESPERANDO_LECTURA', parcela: 'El Carrizal' });
        return [200, { mensaje: 'HS-0161 vinculado a El Carrizal', dispositivo: lista[1] }];
      },
    });
    const u = userEvent.setup();
    montar('/equipos');
    await u.type(await screen.findByLabelText('Código'), 'HS-0161');
    await u.selectOptions(screen.getByLabelText('Parcela'), '9');
    await u.click(screen.getByRole('button', { name: 'Vincular equipo' }));
    expect(await screen.findByRole('status')).toHaveTextContent('HS-0161 vinculado a El Carrizal');
    expect(llamadas.find((l) => l.metodo === 'POST').cuerpo).toEqual({ codigo: 'HS-0161', parcelaId: 9 });
    const fila = (await screen.findByText('HS-0161 · Sensor')).closest('li');
    expect(await within(fila).findByText('Esperando lectura')).toBeInTheDocument();
  });

  it('CP-04-02 · escanear el QR llena el código automáticamente', async () => {
    simularApi({
      ...conSesion(TECNICO),
      'GET /parcelas': [200, { parcelas }],
      'GET /dispositivos': [200, { dispositivos: equipos }],
    });
    const u = userEvent.setup();
    montar('/equipos');
    await u.click(await screen.findByRole('button', { name: /Escanear código QR/ }));
    await u.click(screen.getByRole('button', { name: 'Simular lectura del QR' }));
    expect(screen.getByLabelText('Código')).toHaveValue('HS-0162');
  });

  it('CP-04-04 · si el equipo ya está en otra parcela muestra el aviso del servidor', async () => {
    simularApi({
      ...conSesion(TECNICO),
      'GET /parcelas': [200, { parcelas }],
      'GET /dispositivos': [200, { dispositivos: equipos }],
      'POST /dispositivos/vincular': [409, { error: 'Este equipo ya está vinculado a El Mezquite' }],
    });
    const u = userEvent.setup();
    montar('/equipos');
    await u.type(await screen.findByLabelText('Código'), 'HS-0142');
    await u.selectOptions(screen.getByLabelText('Parcela'), '4');
    await u.click(screen.getByRole('button', { name: 'Vincular equipo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Este equipo ya está vinculado a El Mezquite');
  });

  it('CP-04-05 · sin código ni parcela pide capturarlos y no llama a la API', async () => {
    const { llamadas } = simularApi({
      ...conSesion(TECNICO),
      'GET /parcelas': [200, { parcelas }],
      'GET /dispositivos': [200, { dispositivos: equipos }],
    });
    const u = userEvent.setup();
    montar('/equipos');
    await u.click(await screen.findByRole('button', { name: 'Vincular equipo' }));
    expect(screen.getByText('Captura o escanea el código')).toBeInTheDocument();
    expect(screen.getByText('Elige la parcela')).toBeInTheDocument();
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);
  });

  it('CP-04-07 · el estado se dice con texto: «En línea» y «Sin vincular»', async () => {
    simularApi({
      ...conSesion(TECNICO),
      'GET /parcelas': [200, { parcelas }],
      'GET /dispositivos': [200, { dispositivos: equipos }],
    });
    montar('/equipos');
    expect(await screen.findByText('En línea')).toBeInTheDocument();
    expect(screen.getByText('Sin vincular')).toBeInTheDocument();
  });
});
