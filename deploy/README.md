# Despliegue en AWS (T1.2)

Ambiente de pruebas: **una instancia EC2 con Docker Compose** (nginx + API + PostgreSQL + Mosquitto), pagada con los créditos de AWS del equipo. Decisión registrada en la arquitectura (ADR-004).

## 1. Alerta de presupuesto (primero)

Consola de AWS → **Billing and Cost Management → Budgets → Create budget** → plantilla *Monthly cost budget* → monto: el que quieran gastar al mes como máximo → correo del equipo. Así AWS avisa antes de pasarse de los créditos.

## 2. Lanzar la instancia

1. **EC2 → Launch instance**.
2. Nombre: `agroriego-pruebas`.
3. Imagen: **Ubuntu Server 24.04 LTS**.
4. Tipo: **t3.small** (o t3.micro; el script agrega memoria de intercambio para que alcance).
5. Par de llaves: crea uno y guárdalo (sirve para entrar por SSH).
6. Red → **Security group** nuevo con estas reglas de entrada:
   - SSH (22) solo desde **My IP**.
   - HTTP (80) desde **Anywhere**.
   - Nada más: PostgreSQL y MQTT no se exponen.
7. Almacenamiento: 20 GB gp3.
8. **Advanced details → User data**: pega el contenido de [`instalar-ec2.sh`](instalar-ec2.sh).
9. **Launch instance**.

La instalación tarda unos 10 minutos. Al terminar, abre `http://<IP pública de la instancia>/` y entra con:

| Usuario | Correo | Contraseña |
| --- | --- | --- |
| Productor | productor@agroriego.test | Prueba#2026 |
| Técnico | tecnico@agroriego.test | Prueba#2026 |

Para ver el avance de la instalación: `ssh ubuntu@<IP>` y `sudo tail -f /var/log/agroriego-instalacion.log`.

## 3. Probar el simulador en la instancia

```bash
ssh ubuntu@<IP>
cd /opt/agroriego/simulador
sudo docker run --rm -it --network host -v "$PWD":/app -w /app node:22-alpine \
  sh -c "npm install && node index.js --codigo HS-0161 --rapido"
```

Vincula antes `HS-0161` a una parcela desde la pantalla del técnico; en menos de 10 s su estado cambia a «En línea».

## 4. Actualizar a la última versión de `main`

```bash
ssh ubuntu@<IP>
cd /opt/agroriego && sudo git pull && sudo docker compose up -d --build
```

## 5. Apagar para no gastar créditos

EC2 → selecciona la instancia → **Instance state → Stop**. Los datos se conservan; al encenderla cambia la IP pública.
