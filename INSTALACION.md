# Instalación de SistemaCasita

Esta guía te permite dejar el sistema funcionando en una computadora limpia que
solo tiene **Docker Desktop** instalado.

## Requisitos previos

- Tener [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y en ejecución.
- (Opcional, solo para desarrollar el frontend) [Node.js](https://nodejs.org) 20 o superior.

## Windows

1. Abre el **menú Inicio**, escribe `PowerShell` y ábrelo (no necesitas ejecutarlo como administrador).
2. Ubícate en la carpeta del proyecto. Por ejemplo:
   ```powershell
   cd C:\Users\<tu_usuario>\Desktop\SistemaCasita
   ```
3. Si es la primera vez que ejecutas scripts de PowerShell en este equipo, habilita la ejecución solo para tu usuario:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```
   Cuando pregunte, escribe `S` (Sí) y presiona Enter.
4. Ejecuta el instalador:
   ```powershell
   .\setup.ps1
   ```
5. Espera a que el script termine. Verás un mensaje final indicando que el sistema está listo.

## Linux / Mac

1. Abre una terminal.
2. Ubícate en la carpeta del proyecto:
   ```bash
   cd ~/Desktop/SistemaCasita
   ```
3. Da permisos de ejecución al script (solo la primera vez) y ejecútalo:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
4. Espera a que el script termine. Verás un mensaje final indicando que el sistema está listo.

## ¿Qué hace el script automáticamente?

1. Verifica que Docker y Docker Compose estén instalados y en ejecución.
2. Crea el archivo `backend/.env` (si no existe) a partir de `backend/.env.example`.
3. Ajusta las variables necesarias para que el backend se conecte a la base de datos dentro de Docker.
4. Construye e inicia los contenedores (`app`, `postgres`, `pgadmin`).
5. Espera a que PostgreSQL esté disponible.
6. Instala las dependencias PHP con Composer dentro del contenedor.
7. Genera la clave de aplicación de Laravel (`APP_KEY`).
8. Ejecuta las migraciones y carga los datos iniciales (seeders).
9. Instala las dependencias del frontend (y genera el build si Node.js está disponible).

## Acceso al sistema

| Servicio          | URL                                              |
|-------------------|---------------------------------------------------|
| API Backend       | http://localhost:8000                              |
| pgAdmin           | http://localhost:5050 (usuario: `admin@casita.pe`, clave: `root`) |
| Frontend (dev)    | http://localhost:5173 (ver paso siguiente)         |

### Levantar el frontend en modo desarrollo

El frontend no corre dentro de Docker. Con Node.js instalado, ejecuta:

```bash
cd frontend
npm run dev
```

Luego abre tu navegador en **http://localhost:5173**.

## Detener el sistema

```bash
docker compose down
```

## Problemas comunes

- **"Docker no está instalado o no está en el PATH"**: instala Docker Desktop y reinicia la terminal.
- **"Docker Desktop no está en ejecución"**: abre la aplicación Docker Desktop y espera a que el ícono indique que está activo antes de reintentar.
- **El script falla en las migraciones**: revisa los logs del backend con `docker compose logs app` y de la base de datos con `docker compose logs postgres`.
- **"PostgreSQL no respondió a tiempo" en Windows**: si el contenedor de PostgreSQL ya tenía datos de una instalación anterior con un usuario distinto (por ejemplo `postgres` en vez de `root`), la comprobación puede usar el usuario equivocado. Define la variable de entorno `DB_USERNAME` antes de ejecutar el script para forzar el usuario correcto:
  ```powershell
  $env:DB_USERNAME = "root"
  .\setup.ps1
  ```
  Si no se define, el script usa `postgres` (el superusuario por defecto de la imagen oficial) para esta verificación.
- **Quiero volver a instalar desde cero**: puedes volver a ejecutar el script en cualquier momento; `migrate:fresh` reinicia la base de datos con datos limpios.

## Notas técnicas (PowerShell)

`setup.ps1` ejecuta todos los comandos de Docker a través de una función auxiliar (`Invoke-NativeSafe`) que evita un problema conocido de PowerShell 5.1: si un comando externo escribe avisos o notices en `stderr` (por ejemplo, mensajes normales de arranque de Postgres o advertencias de Docker), PowerShell puede interpretarlos como errores fatales y detener el script aunque el comando haya terminado correctamente (código de salida 0). Por eso el script solo se basa en el código de salida real de cada comando, nunca en si imprimió algo en `stderr`.

También se agregó `name: sistemacasita` en `docker-compose.yml` para que el nombre del proyecto de Docker Compose sea siempre el mismo, sin importar el nombre de la carpeta donde se descomprima el proyecto (evita la advertencia de "nombre de proyecto derivado del directorio" y previene inconsistencias entre `docker compose up` y `docker compose exec`).
