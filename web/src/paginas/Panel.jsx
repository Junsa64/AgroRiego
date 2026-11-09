// P2 · Panel de parcelas del productor (en el Sprint 1 muestra las parcelas registradas, HU-03)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSesion } from '../sesion.jsx';
import { IconoMas } from '../componentes/Iconos.jsx';

export default function Panel() {
  const { usuario, cerrarSesion } = useSesion();
  const [parcelas, setParcelas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/parcelas')
      .then((d) => setParcelas(d.parcelas))
      .catch((err) => setError(err.message));
  }, []);

  const superficieTotal = (parcelas ?? []).reduce((s, p) => s + p.superficieHa, 0);

  return (
    <div className="pantalla">
      <header className="encabezado">
        <div>
          <p className="nota">Hola, {usuario?.nombre}</p>
          <h1>Mis parcelas</h1>
        </div>
        <Link to="/parcelas/nueva" className="boton-icono primario" aria-label="Registrar parcela">
          <IconoMas />
        </Link>
      </header>

      {error && <p className="alerta" role="alert">{error}</p>}
      {parcelas === null && !error && <p className="cargando">Cargando parcelas…</p>}

      {parcelas && (
        <>
          <div className="resumen">
            <div className="tarjeta-dato">
              <strong>{parcelas.length}</strong>
              <span>Parcelas</span>
            </div>
            <div className="tarjeta-dato">
              <strong>{superficieTotal.toLocaleString('es-MX', { maximumFractionDigits: 1 })} ha</strong>
              <span>Superficie total</span>
            </div>
          </div>

          {parcelas.length === 0 ? (
            <div className="vacio">
              <p>Todavía no registras parcelas.</p>
              <Link to="/parcelas/nueva" className="boton primario">Registrar mi primera parcela</Link>
            </div>
          ) : (
            <ul className="lista" aria-label="Parcelas">
              {parcelas.map((p) => (
                <li key={p.id}>
                  <Link to={`/parcelas/${p.id}`} className="tarjeta-parcela">
                    <span className="nombre">{p.nombre}</span>
                    <span className="detalle">
                      {p.cultivo} · {p.superficieHa.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ha
                    </span>
                    <span className="detalle">Umbral de humedad: {p.umbralHumedad} %</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <button type="button" className="enlace centrada" onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  );
}
