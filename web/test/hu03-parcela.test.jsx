// HU-03 · Pantallas de panel y registro de parcela (P2, P7) — parte de interfaz de los casos CP-03-xx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { conSesion, montar, simularApi, PRODUCTOR } from './utilidades.jsx';

const llenar = async (u, { nombre = 'El Carrizal', superficie = '6.5', cultivo = 'Maíz', mapa = true } = {}) => {
  const campoNombre = await screen.findByLabelText('Nombre de la parcela'); // espera a que cargue la pantalla
  if (nombre) await u.type(campoNombre, nombre);
  if (superficie) await u.type(screen.getByLabelText('Superficie (ha)'), superficie);
  if (cultivo) await u.selectOptions(screen.getByLabelText('Cultivo'), cultivo);
  if (mapa) await u.click(screen.getByRole('button', { name: 'Marcar en el mapa' }));
};
const guardar = (u) => u.click(screen.getByRole('button', { name: 'Guardar parcela' }));

describe('HU-03 · Registrar parcela (interfaz)', () => {
  it('CP-03-01 · registro completo: envía los datos y la parcela aparece en el panel', async () => {
    const parcelas = [];
    const { llamadas } = simularApi({
      ...conSesion(PRODUCTOR),
      'GET /parcelas': () => [200, { parcelas }],
      'POST /parcelas': (cuerpo) => {
        parcelas.push({ id: 9, umbralHumedad: 35, ...cuerpo });
        return [201, { parcela: parcelas[0] }];
      },
    });
    const u = userEvent.setup();
    montar('/parcelas/nueva');
    await llenar(u);
    await guardar(u);
    expect(await screen.findByText('El Carrizal')).toBeInTheDocument();
    expect(screen.getByText('Maíz · 6.5 ha')).toBeInTheDocument();
    expect(llamadas.find((l) => l.metodo === 'POST').cuerpo).toEqual({
      nombre: 'El Carrizal',
      superficieHa: 6.5,
      cultivo: 'Maíz',
      latitud: 27.0789,
      longitud: -109.4402,
    });
  });

  it('CP-03-02 · sin nombre no guarda y marca el campo', async () => {
    const { llamadas } = simularApi({ ...conSesion(PRODUCTOR) });
    const u = userEvent.setup();
    montar('/parcelas/nueva');
    await llenar(u, { nombre: '' });
    await guardar(u);
    expect(screen.getByText('Captura el nombre de la parcela')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la parcela')).toHaveAttribute('aria-invalid', 'true');
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);
  });

  it('CP-03-03 · sin superficie pide capturarla', async () => {
    const { llamadas } = simularApi({ ...conSesion(PRODUCTOR) });
    const u = userEvent.setup();
    montar('/parcelas/nueva');
    await llenar(u, { superficie: '' });
    await guardar(u);
    expect(screen.getByText('Captura la superficie en hectáreas para guardar')).toBeInTheDocument();
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);
  });

  it('CP-03-04 · sin ubicación pide marcar el mapa', async () => {
    const { llamadas } = simularApi({ ...conSesion(PRODUCTOR) });
    const u = userEvent.setup();
    montar('/parcelas/nueva');
    await llenar(u, { mapa: false });
    await guardar(u);
    expect(screen.getByText('Marca la ubicación en el mapa')).toBeInTheDocument();
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);
  });

  it('CP-03-05 · superficie 0 se rechaza', async () => {
    simularApi({ ...conSesion(PRODUCTOR) });
    const u = userEvent.setup();
    montar('/parcelas/nueva');
    await llenar(u, { superficie: '0' });
    await guardar(u);
    expect(screen.getByText('La superficie debe ser mayor a 0')).toBeInTheDocument();
  });

  it('CP-03-09 · editar superficie y cultivo se refleja en el panel sin recargar', async () => {
    const parcela = { id: 5, nombre: 'El Carrizal', superficieHa: 6.5, cultivo: 'Maíz', latitud: 27.0789, longitud: -109.4402, umbralHumedad: 35 };
    const { llamadas } = simularApi({
      ...conSesion(PRODUCTOR),
      'GET /parcelas/5': () => [200, { parcela }],
      'PUT /parcelas/5': (cuerpo) => {
        Object.assign(parcela, cuerpo);
        return [200, { parcela }];
      },
      'GET /parcelas': () => [200, { parcelas: [parcela] }],
    });
    const u = userEvent.setup();
    montar('/parcelas/5');
    const superficie = await screen.findByLabelText('Superficie (ha)');
    await u.clear(superficie);
    await u.type(superficie, '7');
    await u.selectOptions(screen.getByLabelText('Cultivo'), 'Trigo');
    await guardar(u);
    expect(await screen.findByText('Trigo · 7 ha')).toBeInTheDocument();
    expect(llamadas.find((l) => l.metodo === 'PUT').cuerpo).toMatchObject({ superficieHa: 7, cultivo: 'Trigo' });
  });

  it('CP-03-10 · si el servidor rechaza un campo, se marca y no sale de la pantalla', async () => {
    const parcela = { id: 5, nombre: 'El Carrizal', superficieHa: 6.5, cultivo: 'Maíz', latitud: 27.0789, longitud: -109.4402 };
    simularApi({
      ...conSesion(PRODUCTOR),
      'GET /parcelas/5': [200, { parcela }],
      'PUT /parcelas/5': [400, { error: 'Revisa los campos marcados', campos: { nombre: 'Captura el nombre de la parcela' } }],
    });
    const u = userEvent.setup();
    montar('/parcelas/5');
    await u.type(await screen.findByLabelText('Nombre de la parcela'), ' Norte');
    await guardar(u);
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa los campos marcados');
    expect(screen.getByText('Captura el nombre de la parcela')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar parcela' })).toBeInTheDocument();
  });
});
