-- T1.3 · HU-01: usuarios, bloqueo por intentos y restablecimiento de contraseña
CREATE TABLE usuarios (
  id                SERIAL PRIMARY KEY,
  nombre            TEXT NOT NULL,
  correo            TEXT NOT NULL UNIQUE,
  hash_contrasena   TEXT NOT NULL,
  rol               TEXT NOT NULL CHECK (rol IN ('PRODUCTOR', 'TECNICO', 'ADMIN')),
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta   TIMESTAMPTZ,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tokens_restablecimiento (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  usado       BOOLEAN NOT NULL DEFAULT false,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
