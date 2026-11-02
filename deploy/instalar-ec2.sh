#!/bin/bash
# Instala AgroRiego en una instancia EC2 nueva (Ubuntu 24.04). Pégalo como «User data» al lanzar la
# instancia, o ejecútalo con sudo dentro de ella. Deja la app en http://<IP pública>/
set -euo pipefail
exec > >(tee /var/log/agroriego-instalacion.log) 2>&1

REPO="https://github.com/Junsa64/AgroRiego.git"
DIR="/opt/agroriego"

# 1. Memoria de intercambio de 2 GB: permite construir la app en instancias pequeñas (t3.micro/t3.small).
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 2. Docker y Git
apt-get update -y
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Código
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi
cd "$DIR"

# 4. Variables de entorno con secretos aleatorios (solo la primera vez)
if [ ! -f .env ]; then
  IP_PUBLICA=$(curl -s --max-time 3 http://checkip.amazonaws.com || echo localhost)
  cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRETO=$(openssl rand -hex 32)
URL_APP=http://${IP_PUBLICA}
COOKIE_SEGURA=false
EOF
  chmod 600 .env
fi

# 5. Levantar y cargar datos semilla del ambiente de pruebas
docker compose up -d --build
sleep 10
docker compose exec -T api npm run seed

echo "AgroRiego quedó instalado. Abre http://$(grep URL_APP .env | cut -d/ -f3)/"
