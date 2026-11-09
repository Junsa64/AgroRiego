# Prompts para Claude Code, uno por tarea del Kanban

> Nota (ADR-006): el Sprint 1 se construyó en JavaScript con node-postgres y migraciones SQL, no con TypeScript y Prisma. Al usar los prompts de los Sprints 2 y 3, pide a Claude Code que siga el stack actual descrito en `CLAUDE.md`.

Cómo usarlos:

1. Abre Claude Code en la carpeta del repositorio. Lee `CLAUDE.md` solo, al iniciar cada sesión.
2. Copia el prompt de la tarea que vas a hacer. Una tarea por sesión o por rama.
3. Revisa lo que propone antes de aceptar cambios, corre las pruebas y abre el pull request.
4. Mueve la tarea en el Kanban: «En progreso» al empezar, «En pruebas» con el PR abierto, «Hecho» al integrarlo.

Cada prompt pide trabajar en su propia rama y hacer commit con el ID de la tarea, para que el historial de GitHub sirva como evidencia del sprint.

---

## Sprint 1 · HU-01, HU-03, HU-04

### T1.1 · Repositorio y estructura (Julian)
```
Lee CLAUDE.md. Crea la estructura inicial del monorepo: carpetas web/ (React + Vite + TypeScript), api/ (Express + TypeScript + Prisma) y simulador/ (Node + TypeScript con cliente MQTT). Agrega docker-compose.yml con PostgreSQL 16 y Mosquitto, .env.example, .gitignore, un README con cómo levantar todo, y scripts npm dev y test en cada carpeta. Deja una ruta GET /salud en la API y una pantalla vacía en web que la llame. Verifica que todo arranca. Rama tarea/T1-1-estructura, commit "T1.1: estructura inicial del monorepo".
```

### T1.2 · Ambiente de pruebas (Julian)
```
Lee CLAUDE.md. Prepara la app para desplegarse en un ambiente de pruebas: Dockerfile para api/ y para web/ (build estático servido por nginx), variables de entorno documentadas en .env.example y un workflow de GitHub Actions que corra las pruebas en cada pull request. No despliegues todavía: explícame las opciones (Render, Railway, AWS, Azure) con su costo para estudiantes y espera mi decisión. Rama tarea/T1-2-ambiente.
```

### T1.3 · Tabla de usuarios (Erro)
```
Lee CLAUDE.md y HU-01 en docs/HISTORIAS.md. En api/prisma crea el modelo Usuario: id, nombre, correo único, hashContrasena, rol (PRODUCTOR | TECNICO | ADMIN), intentosFallidos, bloqueadoHasta, fechas de creación. Agrega un modelo TokenRestablecimiento. Crea la migración y un seed con un productor y un técnico de prueba (contraseñas con bcrypt). Rama tarea/T1-3-tabla-usuarios, commit "T1.3: modelo de usuarios y seed".
```

### T1.4 · API de inicio de sesión (Daniel)
```
Lee CLAUDE.md y HU-01. Implementa en api/: POST /auth/login (JWT en cookie httpOnly), POST /auth/logout, GET /auth/yo, POST /auth/olvide (genera token y muestra el enlace en consola) y POST /auth/restablecer. Cumple los criterios: mensaje genérico «Correo o contraseña incorrectos» y bloqueo de 15 min tras 5 intentos fallidos seguidos. Escribe pruebas con Supertest para cada criterio de aceptación. Rama tarea/T1-4-api-login.
```

### T1.5 · Pantalla de inicio de sesión (Paul)
```
Lee CLAUDE.md, HU-01 y la captura docs/prototipo/P1-inicio-sesion.png. Crea la pantalla de inicio de sesión en web/ igual a la captura: correo, contraseña, enlace «¿Olvidaste tu contraseña?», botón Entrar y aviso de bloqueo. Conéctala a /auth/login; si entra un productor llévalo al panel, si es técnico a la pantalla de equipos. Muestra los errores de la API. Agrega una ruta protegida que redirija al login sin sesión. Rama tarea/T1-5-pantalla-login.
```

### T1.6 · Casos de prueba de HU-01 (Erro)
```
Lee HU-01 y el código de T1.4 y T1.5. Escribe docs/pruebas/HU-01.md con los casos de prueba (ID, precondición, pasos, resultado esperado, resultado obtenido vacío) que cubran cada criterio de aceptación, incluido el bloqueo y el restablecimiento. Revisa que las pruebas automáticas cubran esos casos y agrega las que falten. Rama tarea/T1-6-pruebas-hu01.
```

### T1.7 · Tabla de parcelas (Erro)
```
Lee CLAUDE.md y HU-03. Crea el modelo Parcela en Prisma: id, nombre, superficieHa (decimal), cultivo, latitud, longitud, umbralHumedad (default 35), humedadObjetivo (default 45), productorId, fechas. Migración y seed con 4 parcelas del productor de prueba (El Mezquite, Los Álamos, La Noria, San Ignacio). Rama tarea/T1-7-tabla-parcelas.
```

### T1.8 · API de parcelas (Daniel)
```
Lee CLAUDE.md y HU-03. Implementa GET /parcelas (solo las del usuario en sesión), POST /parcelas, GET /parcelas/:id y PUT /parcelas/:id con validación (zod): todos los campos obligatorios, superficie mayor a 0, coordenadas válidas. Un productor no puede ver ni editar parcelas de otro. Pruebas con Supertest para cada criterio. Rama tarea/T1-8-api-parcelas.
```

### T1.9 · Pantalla de registro de parcela (Paul)
```
Lee CLAUDE.md, HU-03 y las capturas docs/prototipo/P2-panel.png y P7-registrar-parcela.png. Crea en web/ un panel inicial con la lista de parcelas (sin humedad todavía) y la pantalla de nueva parcela: nombre, superficie, cultivo y un mapa con Leaflet + OpenStreetMap para marcar la ubicación. Marca en rojo el campo obligatorio que falte, como en la captura. Permite editar una parcela existente. Rama tarea/T1-9-pantalla-parcela.
```

### T1.10 · Casos de prueba de HU-03 (Erro)
```
Lee HU-03 y el código de T1.8 y T1.9. Escribe docs/pruebas/HU-03.md con los casos de prueba de cada criterio de aceptación y completa las pruebas automáticas que falten, incluida la de que un productor no puede ver parcelas ajenas. Rama tarea/T1-10-pruebas-hu03.
```

### T1.11 · Registro de dispositivos y simulador (Julian)
```
Lee CLAUDE.md y HU-04. Crea el modelo Dispositivo en Prisma: codigo único (por ejemplo HS-0142 o VL-0031), tipo (SENSOR | VALVULA), parcelaId opcional, estado (SIN_VINCULAR | ESPERANDO_LECTURA | EN_LINEA | SIN_CONEXION), bateria, ultimaLectura. En simulador/ crea un script que publique por MQTT en agroriego/lecturas/{codigo} un JSON con humedad, temperatura y batería, cada 5 min o cada 10 s con --rapido. En api/ suscríbete a ese tópico, guarda la lectura y cambia el dispositivo a EN_LINEA en su primera lectura. Rama tarea/T1-11-iot.
```

### T1.12 · API de vinculación (Daniel)
```
Lee CLAUDE.md y HU-04. Implementa POST /dispositivos/vincular (solo rol TECNICO) que recibe codigo y parcelaId. Rechaza con 409 y un mensaje claro si el código ya está vinculado a otra parcela. Agrega GET /dispositivos con su estado. Pruebas con Supertest para cada criterio. Rama tarea/T1-12-api-vinculacion.
```

### T1.13 · Pantalla del técnico (Paul)
```
Lee CLAUDE.md, HU-04 y la captura docs/prototipo/P8-tecnico-equipos.png. Crea la pantalla de equipos del técnico: campo de código, botón para escanear QR con la cámara (librería html5-qrcode), selector de parcela, botón Vincular equipo con mensaje de éxito o de error, y la lista de equipos instalados con su estado en texto y color. Rama tarea/T1-13-pantalla-tecnico.
```

### T1.14 · Pruebas con equipo simulado (Julian)
```
Lee HU-04. Escribe una prueba de integración que levante el broker MQTT de prueba, vincule un sensor, publique una lectura simulada y verifique que el estado pasa de ESPERANDO_LECTURA a EN_LINEA. Documenta los casos en docs/pruebas/HU-04.md. Rama tarea/T1-14-pruebas-hu04.
```

---

## Sprint 2 · HU-05, HU-07, HU-11

- **T2.1 (Julian)** — `Lee CLAUDE.md y HU-05. Haz que la API reciba las lecturas MQTT de forma confiable (reconexión, lecturas duplicadas) y las emita a los clientes conectados por WebSocket (socket.io) en la sala del productor dueño de la parcela.`
- **T2.2 (Erro)** — `Crea el modelo Lectura (dispositivoId, humedad, temperatura, bateria, fecha) con índices por parcela y fecha, y una consulta de la última lectura por parcela que sea rápida con miles de lecturas.`
- **T2.3 (Daniel)** — `Implementa GET /parcelas/resumen con la humedad actual, hora de la última lectura y estado (BAJO_UMBRAL, EN_RANGO, SIN_CONEXION) por parcela. Pruebas para cada criterio de HU-05.`
- **T2.4 (Paul)** — `Haz el panel de la captura docs/prototipo/P2-panel.png con datos reales y actualización en vivo por WebSocket, sin recargar la página. Rojo bajo umbral, verde en rango, siempre con texto.`
- **T2.5 (Erro)** — `Casos de prueba de HU-05 en docs/pruebas/HU-05.md y pruebas automáticas faltantes.`
- **T2.6 (Julian)** — `Implementa el comando MQTT para abrir y cerrar la válvula (agroriego/comandos/{codigo}) y la confirmación de estado desde el simulador; si no confirma en 30 s, márcalo como fallido.`
- **T2.7 (Daniel)** — `Implementa POST /parcelas/:id/riego/iniciar y /detener, con modelo Riego (tipo MANUAL, usuario, inicio, fin, duración). Rechaza si la válvula está sin conexión. Pruebas para cada criterio de HU-07.`
- **T2.8 (Paul)** — `Haz la sección de riego manual de docs/prototipo/P3-detalle-parcela.png: Iniciar riego, confirmación, estado Regando con tiempo y botón Detener; deshabilitado con «Equipo sin conexión».`
- **T2.9 (Julian)** — `Pruebas de integración de riego con la válvula simulada y docs/pruebas/HU-07.md.`
- **T2.10 (Daniel)** — `Regla de humedad crítica: al recibir una lectura bajo el nivel crítico crea una Alerta, sin repetirla en 1 h para la misma parcela. Pruebas para cada criterio de HU-11.`
- **T2.11 (Julian)** — `Notificaciones push web (Web Push con claves VAPID) para las alertas, con suscripción desde la PWA.`
- **T2.12 (Paul)** — `Bandeja de alertas como en docs/prototipo/P5-alertas.png; al tocar una alerta lleva al detalle de la parcela.`
- **T2.13 (Erro)** — `Casos de prueba de HU-11 en docs/pruebas/HU-11.md y pruebas faltantes.`

## Sprint 3 · HU-08, HU-09, HU-12

- **T3.1 (Erro)** — `Modelo ProgramaRiego (parcelaId, días de la semana, hora de inicio, minutos, activo) y validación de empalmes en la misma parcela. Pruebas del caso de conflicto de HU-08.`
- **T3.2 (Julian)** — `Programador de tareas (node-cron o la cola del proveedor de nube) que abre la válvula a la hora del programa y la cierra al cumplir la duración, registrando el Riego como PROGRAMADO.`
- **T3.3 (Paul)** — `Agenda y formulario de nuevo programa como en docs/prototipo/P4-programar-riego.png, con aviso de conflicto.`
- **T3.4 (Erro)** — `Casos de prueba de HU-08 en docs/pruebas/HU-08.md y pruebas faltantes.`
- **T3.5 (Daniel)** — `Lógica de riego automático: si el modo está activo y la humedad baja del umbral, inicia riego AUTOMATICO; al llegar al objetivo, lo detiene. Pruebas para cada criterio de HU-09.`
- **T3.6 (Julian)** — `Conecta el riego automático con la válvula y evita que choque con un riego manual o programado en curso.`
- **T3.7 (Paul)** — `Interruptor de modo automático y campos de umbral y objetivo en la pantalla de riego (captura P4).`
- **T3.8 (Erro)** — `Casos de prueba de HU-09 en docs/pruebas/HU-09.md y pruebas faltantes.`
- **T3.9 (Julian)** — `Monitor que cada minuto marca SIN_CONEXION a los dispositivos sin lecturas en 30 min y genera aviso de batería menor a 15 %.`
- **T3.10 (Daniel)** — `Envía esos avisos al técnico (bandeja y push) y muéstralos en su pantalla de equipos. Pruebas para cada criterio de HU-12.`
- **T3.11 (Paul)** — `Casos de prueba de HU-12 en docs/pruebas/HU-12.md y pruebas faltantes.`
- **T3.12 (Ricardo)** — `Prepara un guion de demostración de 5 minutos que recorra las 9 historias con el simulador en modo --rapido, y una lista de verificación para la revisión final.`
