-- T1.11 · HU-04: inventario de sensores y válvulas, y sus lecturas
CREATE TABLE dispositivos (
  id              SERIAL PRIMARY KEY,
  codigo          TEXT NOT NULL UNIQUE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('SENSOR', 'VALVULA')),
  parcela_id      INTEGER REFERENCES parcelas(id) ON DELETE SET NULL,
  estado          TEXT NOT NULL DEFAULT 'SIN_VINCULAR'
                  CHECK (estado IN ('SIN_VINCULAR', 'ESPERANDO_LECTURA', 'EN_LINEA', 'SIN_CONEXION')),
  bateria         INTEGER,
  ultima_lectura  TIMESTAMPTZ,
  vinculado_en    TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lecturas (
  id             BIGSERIAL PRIMARY KEY,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
  humedad        NUMERIC(5, 2),
  temperatura    NUMERIC(5, 2),
  bateria        INTEGER,
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX lecturas_dispositivo_fecha_idx ON lecturas (dispositivo_id, fecha DESC);
