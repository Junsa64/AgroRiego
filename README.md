# AgroRiego

Sistema de riego inteligente para pequeños y medianos productores del sur de Sonora: monitoreo de humedad de suelo, riego a distancia, riego programado y automático, y alertas.

Proyecto del curso **Métodos Ágiles de Desarrollo** — ITSON, Dr. Carlos Jesús Hinojosa Rodríguez.

## Equipo 3

| Integrante | Rol |
| --- | --- |
| Ricardo Orduño Camacho | Product Owner |
| Julian Espinosa Llanos | Scrum Master · nube e IoT |
| Alejandro Erro González | Base de datos |
| Christian Daniel Valencia Patrón | Backend y API |
| Paul Candelario Seañez Villalobos | Frontend y pruebas |

## Herramientas de seguimiento

| Herramienta | Dónde |
| --- | --- |
| Tablero Kanban | [docs/seguimiento/AgroRiego_Tablero_Kanban.pdf](docs/seguimiento/AgroRiego_Tablero_Kanban.pdf) |
| Niko-Niko | [docs/seguimiento/AgroRiego_Niko-Niko.pdf](docs/seguimiento/AgroRiego_Niko-Niko.pdf) |
| Burndown chart | [docs/seguimiento/AgroRiego_Burndown_Chart.pdf](docs/seguimiento/AgroRiego_Burndown_Chart.pdf) |
| Repositorio de código | Este repositorio |

## Documentos del proyecto

| Documento | Dónde |
| --- | --- |
| Arquitectura preliminar (componentes y despliegue) | [docs/AgroRiego_Arquitectura_Preliminar.pdf](docs/AgroRiego_Arquitectura_Preliminar.pdf) |
| Diseño de pruebas del Sprint 1 | [docs/pruebas/AgroRiego_Diseno_Pruebas_Sprint1.pdf](docs/pruebas/AgroRiego_Diseno_Pruebas_Sprint1.pdf) |

Las versiones editables de los tableros se actualizan en cada junta diaria; los PDF de esta carpeta se renuevan al cierre de cada sprint.

## Plan de sprints

| Sprint | Fechas | Historias |
| --- | --- | --- |
| Sprint 1 | 26 oct – 6 nov 2026 | HU-01 Iniciar sesión · HU-03 Registrar parcela · HU-04 Vincular sensor y válvula |
| Sprint 2 | 9 – 20 nov 2026 | HU-05 Panel de humedad · HU-07 Riego manual · HU-11 Alerta de humedad crítica |
| Sprint 3 | 23 nov – 4 dic 2026 | HU-08 Programar riego · HU-09 Riego automático · HU-12 Alerta de falla de equipo |

Historias y criterios de aceptación: [docs/HISTORIAS.md](docs/HISTORIAS.md) · Prototipo: [docs/prototipo/](docs/prototipo/)

## Cómo correrlo

```bash
cp .env.example .env              # cambia las contraseñas
docker compose up -d --build      # web en http://localhost
docker compose exec api npm run seed
```

Usuarios de prueba: `productor@agroriego.test` y `tecnico@agroriego.test`, contraseña `Prueba#2026`.

| Carpeta | Qué hay |
| --- | --- |
| `api/` | API Express + PostgreSQL: autenticación, parcelas, dispositivos y adaptador MQTT |
| `web/` | App móvil (PWA) en React: inicio de sesión, parcelas y pantalla del técnico |
| `simulador/` | Sensores simulados que publican lecturas por MQTT |
| `deploy/` | Despliegue en AWS EC2 |

Pruebas: `npm test` en cada carpeta. GitHub Actions las corre en cada push.

## Convenciones

- Una rama por tarea del Kanban: `tarea/T1-4-api-login`.
- Commits con el ID de la tarea: `T1.4: API de inicio de sesión`.
- Integración a `main` solo por pull request revisado por otro integrante.
