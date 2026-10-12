#!/usr/bin/env bash
#
# Instalador automatizado de SistemaCasita para Linux/Mac.
# Prepara y levanta el proyecto completo (Laravel + PostgreSQL + Frontend)
# en una computadora limpia que solo tiene Docker Desktop instalado.
#
# Uso: abrir una terminal en la carpeta del proyecto y ejecutar: ./setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

COLOR_CYAN='\033[0;36m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_MAGENTA='\033[0;35m'
COLOR_GRAY='\033[0;90m'
COLOR_RESET='\033[0m'

step()  { echo -e "\n${COLOR_CYAN}==> $1${COLOR_RESET}"; }
ok()    { echo -e "${COLOR_GREEN}[OK] $1${COLOR_RESET}"; }
warn()  { echo -e "${COLOR_YELLOW}[AVISO] $1${COLOR_RESET}"; }
fail()  { echo -e "${COLOR_RED}[ERROR] $1${COLOR_RESET}"; exit 1; }

set_env_value() {
    # set_env_value <archivo> <clave> <valor>
    local env_file="$1"
    local key="$2"
    local value="$3"
    local escaped_value
    escaped_value=$(printf '%s' "$value" | sed -e 's/[\/&]/\\&/g')

    if grep -qE "^\s*#?\s*${key}=" "$env_file"; then
        sed -i.bak -E "s/^\s*#?\s*${key}=.*/${key}=${escaped_value}/" "$env_file"
        rm -f "${env_file}.bak"
    else
        printf '%s=%s\n' "$key" "$value" >> "$env_file"
    fi
}

echo -e "${COLOR_MAGENTA}======================================================${COLOR_RESET}"
echo -e "${COLOR_MAGENTA}   Instalador automatico de SistemaCasita${COLOR_RESET}"
echo -e "${COLOR_MAGENTA}======================================================${COLOR_RESET}"

# 1. Verificar Docker
step "Verificando que Docker este instalado"
if ! command -v docker >/dev/null 2>&1; then
    fail "Docker no esta instalado o no esta en el PATH. Instala Docker Desktop desde https://www.docker.com/products/docker-desktop y vuelve a ejecutar este script."
fi
ok "Docker encontrado: $(command -v docker)"

step "Verificando que Docker este en ejecucion"
if ! docker info >/dev/null 2>&1; then
    fail "Docker Desktop no esta en ejecucion. Abrelo y espera a que inicie por completo antes de volver a ejecutar este script."
fi
ok "Docker esta en ejecucion."

step "Verificando Docker Compose"
if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose no esta disponible (se esperaba 'docker compose'). Actualiza Docker Desktop a una version reciente."
fi
ok "Docker Compose disponible."

# 2. Preparar archivo .env del backend
step "Configurando variables de entorno del backend"
ENV_EXAMPLE="$BACKEND_DIR/.env.example"
ENV_FILE="$BACKEND_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    [ -f "$ENV_EXAMPLE" ] || fail "No se encontro backend/.env.example. No se puede crear el archivo .env."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    ok "Se creo backend/.env a partir de .env.example."
else
    ok "backend/.env ya existe, se mantiene y solo se ajustan las variables necesarias."
fi

set_env_value "$ENV_FILE" "APP_URL" "http://localhost:8000"
set_env_value "$ENV_FILE" "DB_CONNECTION" "pgsql"
set_env_value "$ENV_FILE" "DB_HOST" "postgres"
set_env_value "$ENV_FILE" "DB_PORT" "5432"
set_env_value "$ENV_FILE" "DB_DATABASE" "casita_erp"
set_env_value "$ENV_FILE" "DB_USERNAME" "root"
set_env_value "$ENV_FILE" "DB_PASSWORD" "secretpassword"
set_env_value "$ENV_FILE" "CORS_ALLOWED_ORIGINS" "http://localhost:5173"
ok "Variables de entorno de Docker aseguradas en backend/.env."

# 3. Levantar contenedores
step "Construyendo e iniciando contenedores (docker compose up -d --build)"
(cd "$ROOT_DIR" && docker compose up -d --build) || fail "Fallo al iniciar los contenedores."
ok "Contenedores iniciados."

# 4. Esperar a que PostgreSQL este listo
step "Esperando a que PostgreSQL este listo para aceptar conexiones"
MAX_RETRIES=30
READY=0
for i in $(seq 1 "$MAX_RETRIES"); do
    if (cd "$ROOT_DIR" && docker compose exec -T postgres pg_isready -U root) >/dev/null 2>&1; then
        READY=1
        break
    fi
    echo "  Intento $i/$MAX_RETRIES - PostgreSQL aun no responde, esperando 2s..."
    sleep 2
done
if [ "$READY" -ne 1 ]; then
    fail "PostgreSQL no respondio a tiempo. Revisa 'docker compose logs postgres'."
fi
ok "PostgreSQL esta listo."

# 5. Instalar dependencias de Composer
step "Instalando dependencias PHP (composer install)"
(cd "$ROOT_DIR" && docker compose exec -T app composer install --no-interaction --prefer-dist) \
    || fail "Fallo 'composer install' dentro del contenedor app."
ok "Dependencias PHP instaladas."

# 6. Generar APP_KEY
step "Generando clave de aplicacion (php artisan key:generate)"
(cd "$ROOT_DIR" && docker compose exec -T app php artisan key:generate --force) \
    || fail "Fallo 'php artisan key:generate'."
ok "Clave de aplicacion generada."

# 7. Migraciones + seeders
step "Ejecutando migraciones con datos iniciales (php artisan migrate:fresh --seed)"
(cd "$ROOT_DIR" && docker compose exec -T app php artisan migrate:fresh --seed --force) \
    || fail "Fallo al ejecutar las migraciones/seeders."
ok "Base de datos migrada y poblada con datos iniciales."

# 8. Frontend
step "Preparando frontend (React + Vite)"
if [ ! -d "$FRONTEND_DIR" ]; then
    warn "No se encontro la carpeta frontend, se omite este paso."
else
    if command -v npm >/dev/null 2>&1; then
        ok "Node.js/npm detectado localmente, se usara directamente."
        (
            cd "$FRONTEND_DIR"
            npm install
            if npm run build; then
                ok "Build de frontend generado en frontend/dist."
            else
                warn "No se pudo generar el build de produccion del frontend. Puedes ejecutar 'npm run dev' manualmente para desarrollo."
            fi
        )
    else
        warn "No se encontro Node.js/npm en el sistema. Se usara una imagen temporal de Docker para instalar dependencias."
        if docker run --rm -v "$FRONTEND_DIR:/app" -w /app node:20-alpine npm install; then
            ok "Dependencias del frontend instaladas mediante Docker."
            warn "Para desarrollar el frontend necesitas Node.js instalado localmente (para 'npm run dev'). El backend funciona sin el."
        else
            warn "No se pudieron instalar las dependencias del frontend automaticamente. Instala Node.js (https://nodejs.org) y ejecuta 'npm install' y 'npm run dev' dentro de la carpeta frontend."
        fi
    fi
fi

# 9. Mensaje final
echo ""
echo -e "${COLOR_GREEN}======================================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}   SistemaCasita esta listo para usarse${COLOR_RESET}"
echo -e "${COLOR_GREEN}======================================================${COLOR_RESET}"
echo ""
echo "  API Backend:     http://localhost:8000"
echo "  pgAdmin:         http://localhost:5050  (admin@casita.pe / root)"
echo "  Frontend (dev):  http://localhost:5173   (ejecuta 'cd frontend && npm run dev')"
echo ""
echo -e "${COLOR_GRAY}Para detener el sistema ejecuta: docker compose down${COLOR_RESET}"
echo ""
