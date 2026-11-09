// Restablecer contraseña desde el enlace del correo (HU-01, CA4)
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Campo } from './Login.jsx';

export default function Restablecer() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    try {
      const { mensaje } = await api('/auth/restablecer', { metodo: 'POST', cuerpo: { token, contrasena } });
      setListo(mensaje);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="pantalla">
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1>Nueva contraseña</h1>
        {listo ? (
          <>
            <p className="exito" role="status">{listo}</p>
            <Link className="boton primario" to="/login">Ir a iniciar sesión</Link>
          </>
        ) : (
          <>
            <Campo id="nueva" etiqueta="Contraseña nueva (mínimo 8 caracteres)">
              <input id="nueva" type="password" autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
            </Campo>
            {error && <p className="alerta" role="alert">{error}</p>}
            <button type="submit" className="boton primario">Guardar contraseña</button>
          </>
        )}
      </form>
    </div>
  );
}
