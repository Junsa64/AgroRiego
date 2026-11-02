import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida, inicioPorRol, useSesion } from './sesion.jsx';
import Login from './paginas/Login.jsx';
import Restablecer from './paginas/Restablecer.jsx';
import Panel from './paginas/Panel.jsx';
import FormParcela from './paginas/FormParcela.jsx';
import Equipos from './paginas/Equipos.jsx';

function Inicio() {
  const { usuario } = useSesion();
  if (usuario === undefined) return <p className="cargando">Cargando…</p>;
  return <Navigate to={usuario ? inicioPorRol(usuario) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/restablecer" element={<Restablecer />} />
      <Route
        path="/panel"
        element={
          <RutaProtegida rol="PRODUCTOR">
            <Panel />
          </RutaProtegida>
        }
      />
      <Route
        path="/parcelas/nueva"
        element={
          <RutaProtegida rol="PRODUCTOR">
            <FormParcela />
          </RutaProtegida>
        }
      />
      <Route
        path="/parcelas/:id"
        element={
          <RutaProtegida rol="PRODUCTOR">
            <FormParcela />
          </RutaProtegida>
        }
      />
      <Route
        path="/equipos"
        element={
          <RutaProtegida rol="TECNICO">
            <Equipos />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
