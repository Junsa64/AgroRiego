// P7 · Registrar o editar parcela (HU-03, T1.9)
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Campo } from './Login.jsx';
import MapaUbicacion from '../componentes/MapaUbicacion.jsx';
import { IconoAtras } from '../componentes/Iconos.jsx';

export const CULTIVOS = ['Trigo', 'Maíz', 'Garbanzo', 'Frijol', 'Sorgo', 'Hortalizas', 'Otro'];

export function validar({ nombre, superficie, cultivo, ubicacion }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'Captura el nombre de la parcela';
  if (superficie === '' || superficie === null) errores.superficieHa = 'Captura la superficie en hectáreas para guardar';
  else if (!Number.isFinite(Number(superficie))) errores.superficieHa = 'La superficie debe ser un número';
  else if (Number(superficie) <= 0) errores.superficieHa = 'La superficie debe ser mayor a 0';
  if (!cultivo) errores.cultivo = 'Elige el cultivo';
  if (!ubicacion) errores.latitud = 'Marca la ubicación en el mapa';
  return errores;
}

export default function FormParcela() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();
  const [nombre, setNombre] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [cultivo, setCultivo] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    api(`/parcelas/${id}`)
      .then(({ parcela }) => {
        setNombre(parcela.nombre);
        setSuperficie(String(parcela.superficieHa));
        setCultivo(parcela.cultivo);
        setUbicacion({ latitud: parcela.latitud, longitud: parcela.longitud });
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [editando, id]);

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    const encontrados = validar({ nombre, superficie, cultivo, ubicacion });
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    const cuerpo = {
      nombre: nombre.trim(),
      superficieHa: Number(superficie),
      cultivo,
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
    };
    setGuardando(true);
    try {
      await api(editando ? `/parcelas/${id}` : '/parcelas', { metodo: editando ? 'PUT' : 'POST', cuerpo });
      navegar('/panel');
    } catch (err) {
      setErrores(err.campos ?? {});
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p className="cargando">Cargando parcela…</p>;

  return (
    <div className="pantalla">
      <header className="encabezado">
        <Link to="/panel" className="boton-icono" aria-label="Volver al panel">
          <IconoAtras />
        </Link>
        <h1 className="titulo-centro">{editando ? 'Editar parcela' : 'Nueva parcela'}</h1>
      </header>

      <form className="formulario" onSubmit={guardar} noValidate>
        <Campo id="nombre" etiqueta="Nombre de la parcela" error={errores.nombre}>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
        </Campo>
        <div className="dos-columnas">
          <Campo id="superficie" etiqueta="Superficie (ha)" error={errores.superficieHa}>
            <input id="superficie" type="number" inputMode="decimal" step="0.1" min="0" value={superficie} onChange={(e) => setSuperficie(e.target.value)} aria-invalid={!!errores.superficieHa} />
          </Campo>
          <Campo id="cultivo" etiqueta="Cultivo" error={errores.cultivo}>
            <select id="cultivo" value={cultivo} onChange={(e) => setCultivo(e.target.value)} aria-invalid={!!errores.cultivo}>
              <option value="">Elige…</option>
              {CULTIVOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>
        </div>
        <div className={`campo${errores.latitud ? ' con-error' : ''}`}>
          <span className="etiqueta">Ubicación</span>
          <MapaUbicacion valor={ubicacion} alCambiar={setUbicacion} conError={!!errores.latitud} />
          {errores.latitud && <span className="error-campo">{errores.latitud}</span>}
        </div>
        {error && <p className="alerta" role="alert">{error}</p>}
        <button type="submit" className="boton primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar parcela'}
        </button>
      </form>
    </div>
  );
}
