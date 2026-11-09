// Escáner de código QR con la cámara del celular (BarcodeDetector del navegador, sin librerías)
import { useEffect, useRef, useState } from 'react';

export const escanerDisponible = () =>
  typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

export default function EscanerQR({ alLeer, alCerrar }) {
  const video = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!escanerDisponible()) {
      setError('Tu navegador no permite escanear códigos. Captura el código a mano.');
      return undefined;
    }
    let flujo;
    let intervalo;
    let activo = true;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        flujo = s;
        if (!activo) return;
        video.current.srcObject = s;
        video.current.play?.();
        intervalo = setInterval(async () => {
          try {
            const codigos = await detector.detect(video.current);
            if (codigos[0]?.rawValue && activo) {
              activo = false;
              alLeer(codigos[0].rawValue);
            }
          } catch {
            /* el siguiente cuadro lo vuelve a intentar */
          }
        }, 300);
      })
      .catch(() => setError('No se pudo abrir la cámara. Revisa el permiso o captura el código a mano.'));

    return () => {
      activo = false;
      clearInterval(intervalo);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [alLeer]);

  return (
    <div className="escaner">
      {error ? (
        <p className="alerta" role="alert">{error}</p>
      ) : (
        <video ref={video} className="video-escaner" muted playsInline aria-label="Cámara para escanear el código QR" />
      )}
      <button type="button" className="boton secundario" onClick={alCerrar}>Cerrar cámara</button>
    </div>
  );
}
