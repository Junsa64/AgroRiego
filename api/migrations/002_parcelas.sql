-- T1.7 · HU-03: parcelas del productor
CREATE TABLE parcelas (
  id               SERIAL PRIMARY KEY,
  productor_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  superficie_ha    NUMERIC(10, 2) NOT NULL CHECK (superficie_ha > 0),
  cultivo          TEXT NOT NULL,
  latitud          DOUBLE PRECISION NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud         DOUBLE PRECISION NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  umbral_humedad   INTEGER NOT NULL DEFAULT 35,
  humedad_objetivo INTEGER NOT NULL DEFAULT 45,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX parcelas_productor_idx ON parcelas (productor_id);
