# SistemaCasita - Guía de Desarrollo

## Comandos de Backend (Laravel en Docker)

- **Migraciones:** `docker compose exec app php artisan migrate`
- **Crear Modelo y Migración:** `docker compose exec app php artisan make:model Nombre -m`
- **Limpiar Caché:** `docker compose exec app php artisan config:clear`
- **Composer:** `docker compose exec app composer install`

## Comandos de Frontend (React + Vite)

- **Ruta:** `cd frontend`
- **Desarrollo:** `npm run dev`
- **Build:** `npm run build`

## Reglas de Arquitectura

- Base de datos: PostgreSQL 16 corriendo en Docker.
- Backend: Laravel 11 (API REST en puerto 8000).
- Frontend: React + TypeScript + Tailwind CSS v4 (puerto 5173).
- Las llamadas a API deben usar el cliente en `src/api/axios.ts`.
