// P1 · Inicio de sesión (HU-01, T1.5)
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { inicioPorRol, useSesion } from '../sesion.jsx';
import { IconoGota } from '../componentes/Iconos.jsx';

export default function Login() {
  const { usuario, setUsuario } = useSesion();
  const navegar = useNavigate();
  const [modo, setModo] = useState('login');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={inicioPorRol(usuario)} replace />;

  const entrar = async (e) => {
    e.preventDefault();
    setError('');
    const faltan = {};
    if (!correo.trim()) faltan.correo = 'Captura tu correo';
    if (!contrasena) faltan.contrasena = 'Captura tu contraseña';
    setErrores(faltan);
    if (Object.keys(faltan).length) return;

    setEnviando(true);
    try {
      const { usuario: u } = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: correo.trim(), contrasena } });
      setUsuario(u);
      navegar(inicioPorRol(u), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const solicitarEnlace = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim()) {
      setErrores({ correo: 'Captura tu correo' });
      return;
    }
    setEnviando(true);
    try {
      const { mensaje } = await api('/auth/olvide', { metodo: 'POST', cuerpo: { correo: correo.trim() } });
      setAviso(mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla pantalla-login">
      <header className="login-encabezado">
        <span className="logo">
          <IconoGota color="#1E6B47" />
        </span>
        <h1>AgroRiego</h1>
        <p>Riega solo cuando tu cultivo lo necesita.</p>
      </header>

      {modo === 'login' ? (
        <form className="formulario" onSubmit={entrar} noValidate>
          <h2>Inicia sesión</h2>
          <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
            <input id="correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={!!errores.correo} />
          </Campo>
          <Campo id="contrasena" etiqueta="Contraseña" error={errores.contrasena}>
            <input id="contrasena" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} aria-invalid={!!errores.contrasena} />
          </Campo>
          <button type="button" className="enlace derecha" onClick={() => { setModo('olvide'); setErrores({}); setError(''); }}>
            ¿Olvidaste tu contraseña?
          </button>
          {error && <p className="alerta" role="alert">{error}</p>}
          <button type="submit" className="boton primario" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="nota centrada">Por seguridad, tras 5 intentos fallidos la cuenta se bloquea 15 minutos.</p>
        </form>
      ) : (
        <form className="formulario" onSubmit={solicitarEnlace} noValidate>
          <h2>Restablece tu contraseña</h2>
          <p className="nota">Te enviaremos un enlace a tu correo para crear una contraseña nueva.</p>
          <Campo id="correo-olvide" etiqueta="Correo electrónico" error={errores.correo}>
            <input id="correo-olvide" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={!!errores.correo} />
          </Campo>
          {aviso && <p className="exito" role="status">{aviso}</p>}
          {error && <p className="alerta" role="alert">{error}</p>}
          <button type="submit" className="boton primario" disabled={enviando}>Enviar enlace</button>
          <button type="button" className="enlace centrada" onClick={() => { setModo('login'); setAviso(''); setErrores({}); }}>
            Volver a iniciar sesión
          </button>
        </form>
      )}
      <p className="pie-login">¿Eres técnico de campo? Entra con tu cuenta de técnico: la app te lleva a tus equipos.</p>
    </div>
  );
}

export function Campo({ id, etiqueta, error, children }) {
  return (
    <div className={`campo${error ? ' con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error && (
        <span className="error-campo" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
