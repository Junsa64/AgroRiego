# AgroRiego

App de riego inteligente para pequeños y medianos productores del sur de Sonora. El productor ve la humedad de suelo de sus parcelas, riega a distancia, programa riegos y recibe alertas. El técnico de campo vincula sensores y válvulas a las parcelas.

Proyecto escolar del Equipo 3 — Métodos Ágiles de Desarrollo (ITSON, Dr. Carlos Jesús Hinojosa Rodríguez). Se trabaja con Scrum: 3 sprints de 2 semanas, 3 historias de usuario por sprint.

## Alcance por sprint

Solo construye lo del sprint en curso. Las historias completas con criterios de aceptación están en `docs/HISTORIAS.md`.

| Sprint | Fechas | Historias |
| --- | --- | --- |
| Sprint 1 | 26 oct – 6 nov 2026 | HU-01 Iniciar sesión · HU-03 Registrar parcela · HU-04 Vincular sensor y válvula |
| Sprint 2 | 9 – 20 nov 2026 | HU-05 Panel de humedad en tiempo real · HU-07 Riego manual · HU-11 Alerta de humedad crítica |
| Sprint 3 | 23 nov – 4 dic 2026 | HU-08 Programar riego · HU-09 Riego automático por umbral · HU-12 Alerta de falla de equipo |

Fuera de alcance (backlog futuro): HU-02, HU-06, HU-10, HU-13, HU-14, HU-15, HU-16. No las implementes aunque parezcan fáciles.

## Stack

- **Monorepo** con dos carpetas: `web/` y `api/`. Node.js 20+ y TypeScript en ambas.
- **web/**: React + Vite, diseño mobile-first (390 px de ancho), instalable como PWA. React Router para pantallas.
- **api/**: Express + Prisma.
- **Base de datos**: PostgreSQL 16 en Docker (`docker-compose.yml` en la raíz).
- **Sensores y válvulas**: no hay hardware. Se simulan con `simulador/`, un script que publica lecturas por MQTT (broker Mosquitto en Docker) cada 5 minutos, o cada 10 s con `--rapido` para demos.
- **Pruebas**: Vitest + Supertest en `api/`, Vitest + Testing Library en `web/`.
- **Despliegue**: AWS, con los créditos del equipo. Una instancia EC2 corre todo con Docker Compose (nginx, API, PostgreSQL, Mosquitto); más adelante se puede pasar a Amazon RDS y AWS IoT Core. Mantén todo configurable por variables de entorno (`.env.example` actualizado) y evita servicios que salgan de los créditos.
- **Arquitectura**: ver `docs/AgroRiego_Arquitectura_Preliminar.pdf` (monolito modular; respeta sus módulos).

## Diseño (respeta el prototipo)

Las capturas del prototipo de alta fidelidad están en `docs/prototipo/` (P1 a P8). Cada pantalla nueva debe parecerse a su captura.

- Colores: verde `#1E6B47` (acciones y estado correcto), azul `#1C64A8` (agua, riego activo), ámbar `#B45309` (avisos), rojo `#9B1C12` (crítico), fondo `#F4F6F2`, texto `#14211A`.
- Tipografía: Manrope (o Inter como respaldo). Cifras de humedad grandes.
- Botones de 44 px de alto o más. El estado siempre se dice con texto además del color («Bajo umbral», «Regando», «Sin conexión»).
- Textos de la interfaz en español de México.

## Reglas de trabajo

- **Una tarea del Kanban a la vez.** Las tareas tienen ID (T1.1, T1.2…) y están en `docs/PROMPTS.md`.
- **Commits**: en español y con el ID de la tarea al inicio, por ejemplo `T1.4: API de inicio de sesión con bloqueo tras 5 intentos`. Si existe la clave de Jira, agrégala: `AGRO-3 T1.4: …`.
- **Ramas**: una por tarea, `tarea/T1-4-api-login`. Se integra a `main` por pull request.
- **Pruebas**: cada criterio de aceptación de la historia debe tener al menos una prueba automática. Corre las pruebas antes de dar una tarea por terminada.
- **Casos de prueba**: además de las pruebas automáticas, documenta los casos en `docs/pruebas/HU-XX.md` (ID, pasos, resultado esperado, resultado obtenido). El equipo los usa para el informe del sprint.
- **Seguridad**: contraseñas con bcrypt, sesiones con JWT en cookie httpOnly, nunca subas `.env`.
- No agregues dependencias pesadas sin explicar por qué.

## Comandos

(Actualiza esta sección cuando existan.)

- `docker compose up -d` — base de datos y broker MQTT
- `npm run dev` en `api/` y en `web/`
- `npm test` en `api/` y en `web/`
- `npm run simular` en `simulador/`

## Equipo y responsables

- Alejandro Erro — base de datos
- Christian Daniel Valencia — backend y API
- Julian Espinosa — nube e IoT (Scrum Master)
- Paul Seañez — frontend y pruebas
- Ricardo Orduño — Product Owner (acepta las historias)
