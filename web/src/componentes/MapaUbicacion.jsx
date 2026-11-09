// Mapa para marcar la ubicación de la parcela (Leaflet + OpenStreetMap)
import { useEffect, useRef } from 'react';
import L from 'leaflet';

const NAVOJOA = [27.0787, -109.4437];

export default function MapaUbicacion({ valor, alCambiar, conError }) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const marcador = useRef(null);
  const alCambiarRef = useRef(alCambiar);
  alCambiarRef.current = alCambiar;

  useEffect(() => {
    const centro = valor ? [valor.latitud, valor.longitud] : NAVOJOA;
    const m = L.map(contenedor.current, { zoomControl: true }).setView(centro, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    m.on('click', (e) => {
      alCambiarRef.current({ latitud: Number(e.latlng.lat.toFixed(6)), longitud: Number(e.latlng.lng.toFixed(6)) });
    });
    mapa.current = m;
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapa.current) return;
    if (!valor) {
      marcador.current?.remove();
      marcador.current = null;
      return;
    }
    const punto = [valor.latitud, valor.longitud];
    if (marcador.current) marcador.current.setLatLng(punto);
    else {
      marcador.current = L.circleMarker(punto, { radius: 9, color: '#1E6B47', fillColor: '#1E6B47', fillOpacity: 0.6 }).addTo(mapa.current);
    }
  }, [valor]);

  const usarMiUbicacion = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const nuevo = { latitud: Number(pos.coords.latitude.toFixed(6)), longitud: Number(pos.coords.longitude.toFixed(6)) };
      alCambiarRef.current(nuevo);
      mapa.current?.setView([nuevo.latitud, nuevo.longitud], 15);
    });
  };

  return (
    <div className="mapa-bloque">
      <div ref={contenedor} className={`mapa${conError ? ' con-error' : ''}`} role="application" aria-label="Mapa: toca para marcar la ubicación de la parcela" />
      <div className="mapa-pie">
        <span className="nota">
          {valor ? `${valor.latitud.toFixed(4)}°, ${valor.longitud.toFixed(4)}°` : 'Toca el mapa para marcar la parcela.'}
        </span>
        <button type="button" className="enlace" onClick={usarMiUbicacion}>Usar mi ubicación</button>
      </div>
    </div>
  );
}
