// P8 · Técnico: vincular sensores y válvulas (HU-04, T1.13)
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSesion } from '../sesion.jsx';
import { Campo } from './Login.jsx';
import EscanerQR from '../componentes/EscanerQR.jsx';
import { IconoQR } from '../componentes/Iconos.jsx';

export const ESTADOS = {
  SIN_VINCULAR: { texto: 'Sin vincular', clase: 'neutro' },
  ESPERANDO_LECTURA: { texto: 'Esperando lectura', clase: 'aviso' },
  EN_LINEA: { texto: 'En línea', clase: 'bien' },
  SIN_CONEXION: { texto: 'Sin conexión', clase: 'critico' },
};

export default function Equipos() {
  const { cerrarSesion } = useSesion();
  const [parcelas, setParcelas] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [parcelaId, setParcelaId] = useState('');
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargarDispositivos = useCallback(() => {
    api('/dispositivos')
      .then((d) => setDispositivos(d.dispositivos))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api('/parcelas')
      .then((d) => setParcelas(d.parcelas))
      .catch((err) => setError(err.message));
    cargarDispositivos();
    // El estado cambia a «En línea» cuando llega la primera lectura: se revisa cada 10 s.
    const intervalo = setInterval(cargarDispositivos, 10000);
    return () => clearInterval(intervalo);
  }, [cargarDispositivos]);

  const alLeerQR = useCallback((valor) => {
    setCodigo(valor.trim().toUpperCase());
    setEscaneando(false);
  }, []);

  const vincular = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    const faltan = {};
    if (!codigo.trim()) faltan.codigo = 'Captura o escanea el código';
    if (!parcelaId) faltan.parcela = 'Elige la parcela';
    setErrores(faltan);
    if (Object.keys(faltan).length) return;

    setEnviando(true);
    try {
      const r = await api('/dispositivos/vincular', {
        metodo: 'POST',
        cuerpo: { codigo: codigo.trim(), parcelaId: Number(parcelaId) },
      });
      setMensaje(`${r.mensaje}. Esperando su primera lectura…`);
      setCodigo('');
      cargarDispositivos();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla">
      <header className="encabezado">
        <div>
          <p className="etiqueta-rol">Técnico de campo</p>
          <h1>Equipos</h1>
        </div>
        <button type="button" className="enlace" onClick={cerrarSesion}>Salir</button>
      </header>

      <form className="tarjeta formulario" onSubmit={vincular} noValidate>
        <h2>Vincular sensor o válvula</h2>
        {escaneando ? (
          <EscanerQR alLeer={alLeerQR} alCerrar={() => setEscaneando(false)} />
        ) : (
          <button type="button" className="boton oscuro" onClick={() => setEscaneando(true)}>
            <IconoQR /> Escanear código QR
          </button>
        )}
        <div className="dos-columnas">
          <Campo id="codigo" etiqueta="Código" error={errores.codigo}>
            <input id="codigo" value={codigo} placeholder="HS-0000" autoCapitalize="characters" onChange={(e) => setCodigo(e.target.value)} aria-invalid={!!errores.codigo} />
          </Campo>
          <Campo id="parcela" etiqueta="Parcela" error={errores.parcela}>
            <select id="parcela" value={parcelaId} onChange={(e) => setParcelaId(e.target.value)} aria-invalid={!!errores.parcela}>
              <option value="">Elige…</option>
              {parcelas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                  {p.productor ? ` · ${p.productor}` : ''}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        {mensaje && <p className="exito" role="status">{mensaje}</p>}
        {error && <p className="alerta" role="alert">{error}</p>}
        <button type="submit" className="boton primario" disabled={enviando}>
          {enviando ? 'Vinculando…' : 'Vincular equipo'}
        </button>
      </form>

      <h2 className="subtitulo">Equipo instalado</h2>
      <ul className="lista" aria-label="Equipos">
        {dispositivos.map((d) => {
          const estado = ESTADOS[d.estado] ?? { texto: d.estado, clase: 'neutro' };
          return (
            <li key={d.id} className="tarjeta-equipo">
              <div>
                <span className="nombre">
                  {d.codigo} · {d.tipo === 'VALVULA' ? 'Válvula' : 'Sensor'}
                </span>
                <span className="detalle">
                  {d.parcela ?? 'Sin parcela'}
                  {d.bateria != null ? ` · batería ${d.bateria} %` : ''}
                </span>
              </div>
              <span className={`pastilla ${estado.clase}`}>{estado.texto}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
