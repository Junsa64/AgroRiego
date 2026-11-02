import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from './api.js';

const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  // undefined = verificando, null = sin sesión
  const [usuario, setUsuario] = useState(undefined);

  useEffect(() => {
    let vigente = true;
    api('/auth/yo')
      .then((d) => vigente && setUsuario(d.usuario))
      .catch(() => vigente && setUsuario(null));
    return () => {
      vigente = false;
    };
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api('/auth/logout', { metodo: 'POST' });
    } finally {
      setUsuario(null);
    }
  }, []);

  return (
    <ContextoSesion.Provider value={{ usuario, setUsuario, cerrarSesion }}>{children}</ContextoSesion.Provider>
  );
}

export const useSesion = () => useContext(ContextoSesion);

export const inicioPorRol = (usuario) => (usuario?.rol === 'TECNICO' ? '/equipos' : '/panel');

export function RutaProtegida({ rol, children }) {
  const { usuario } = useSesion();
  if (usuario === undefined) return <p className="cargando">Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to={inicioPorRol(usuario)} replace />;
  return children;
}
