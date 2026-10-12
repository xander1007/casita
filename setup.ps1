<#
.SYNOPSIS
    Instalador automatizado de SistemaCasita para Windows.
.DESCRIPTION
    Prepara y levanta el proyecto completo (Laravel + PostgreSQL + Frontend)
    en una computadora limpia que solo tiene Docker Desktop instalado.
.USAGE
    Abrir PowerShell en la carpeta del proyecto y ejecutar: .\setup.ps1
#>

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-WarnMsg {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# PowerShell 5.1 envuelve cada linea de stderr de un comando nativo en un
# NativeCommandError. Con $ErrorActionPreference = "Stop" eso se convierte en
# una excepcion que corta el script aunque el proceso haya terminado con
# codigo 0 (por ejemplo, avisos/notices de Docker o de Postgres). Por eso
# TODAS las llamadas a comandos nativos (docker, npm, etc.) pasan por esta
# funcion, que baja la preferencia de error solo mientras dura la llamada y
# se apoya unicamente en $LASTEXITCODE para decidir si algo fallo de verdad.
function Invoke-NativeSafe {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$Quiet
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & $Executable @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    if (-not $Quiet -and $output) {
        $output | ForEach-Object { Write-Host $_ }
    }

    return [PSCustomObject]@{
        ExitCode = $exitCode
        Output   = $output
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Description,
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $RootDir,
        [switch]$Quiet
    )
    Write-Step $Description
    Push-Location $WorkingDirectory
    try {
        $result = Invoke-NativeSafe -Executable $Executable -Arguments $Arguments -Quiet:$Quiet
    }
    finally {
        Pop-Location
    }
    if ($result.ExitCode -ne 0) {
        Write-ErrorMsg "Fallo: $Description (codigo de salida $($result.ExitCode))"
        exit 1
    }
    Write-Ok "$Description completado."
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$EnvPath,
        [Parameter(Mandatory = $true)][string]$Key,
        [Parameter(Mandatory = $true)][string]$Value
    )
    $content = Get-Content -Path $EnvPath -Raw
    $pattern = "(?m)^\s*#?\s*$([regex]::Escape($Key))\s*=.*$"
    $newLine = "$Key=$Value"
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ $newLine })
    }
    else {
        $content = $content.TrimEnd() + "`r`n$newLine`r`n"
    }
    Set-Content -Path $EnvPath -Value $content -NoNewline
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$EnvPath,
        [Parameter(Mandatory = $true)][string]$Key
    )
    $match = Select-String -Path $EnvPath -Pattern "^\s*$([regex]::Escape($Key))\s*=(.*)$" | Select-Object -First 1
    if ($match) { return $match.Matches[0].Groups[1].Value.Trim() }
    return ""
}

function New-RandomPassword {
    $chars = [char[]]"abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "   Instalador automatico de SistemaCasita" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta

# 1. Verificar Docker
Write-Step "Verificando que Docker este instalado"
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-ErrorMsg "Docker no esta instalado o no esta en el PATH. Instala Docker Desktop desde https://www.docker.com/products/docker-desktop y vuelve a ejecutar este script."
    exit 1
}
Write-Ok "Docker encontrado en: $($dockerCmd.Source)"

Write-Step "Verificando que Docker este en ejecucion"
$dockerInfo = Invoke-NativeSafe -Executable "docker" -Arguments @("info") -Quiet
if ($dockerInfo.ExitCode -ne 0) {
    Write-ErrorMsg "Docker Desktop no esta en ejecucion. Abrelo y espera a que inicie por completo antes de volver a ejecutar este script."
    exit 1
}
Write-Ok "Docker esta en ejecucion."

Write-Step "Verificando Docker Compose"
$composeVersion = Invoke-NativeSafe -Executable "docker" -Arguments @("compose", "version") -Quiet
if ($composeVersion.ExitCode -ne 0) {
    Write-ErrorMsg "Docker Compose no esta disponible (se esperaba 'docker compose'). Actualiza Docker Desktop a una version reciente."
    exit 1
}
Write-Ok "Docker Compose disponible."

# 2a. Preparar archivo .env de la raiz (credenciales de docker-compose.yml)
Write-Step "Configurando credenciales de Docker Compose"
$rootEnvExample = Join-Path $RootDir ".env.example"
$rootEnvFile = Join-Path $RootDir ".env"

if (-not (Test-Path $rootEnvFile)) {
    if (-not (Test-Path $rootEnvExample)) {
        Write-ErrorMsg "No se encontro .env.example en la raiz del proyecto."
        exit 1
    }
    Copy-Item -Path $rootEnvExample -Destination $rootEnvFile
    Write-Ok "Se creo .env a partir de .env.example."
}
else {
    Write-Ok ".env ya existe, se mantienen sus credenciales."
}

# Reemplazamos las claves de ejemplo por claves aleatorias
foreach ($key in @("DB_PASSWORD", "PGADMIN_PASSWORD")) {
    $current = Get-EnvValue -EnvPath $rootEnvFile -Key $key
    if (-not $current -or $current -eq "cambia_esta_clave") {
        Set-EnvValue -EnvPath $rootEnvFile -Key $key -Value (New-RandomPassword)
        Write-Ok "Se genero una clave aleatoria para $key."
    }
}

$dbDatabase = Get-EnvValue -EnvPath $rootEnvFile -Key "DB_DATABASE"
$dbUsername = Get-EnvValue -EnvPath $rootEnvFile -Key "DB_USERNAME"
$dbPassword = Get-EnvValue -EnvPath $rootEnvFile -Key "DB_PASSWORD"
$pgadminEmail = Get-EnvValue -EnvPath $rootEnvFile -Key "PGADMIN_EMAIL"
$pgadminPassword = Get-EnvValue -EnvPath $rootEnvFile -Key "PGADMIN_PASSWORD"

# 2b. Preparar archivo .env del backend
Write-Step "Configurando variables de entorno del backend"
$envExample = Join-Path $BackendDir ".env.example"
$envFile = Join-Path $BackendDir ".env"

if (-not (Test-Path $envFile)) {
    if (-not (Test-Path $envExample)) {
        Write-ErrorMsg "No se encontro backend\.env.example. No se puede crear el archivo .env."
        exit 1
    }
    Copy-Item -Path $envExample -Destination $envFile
    Write-Ok "Se creo backend\.env a partir de .env.example."
}
else {
    Write-Ok "backend\.env ya existe, se mantiene y solo se ajustan las variables necesarias."
}

# Aseguramos los valores requeridos para trabajar dentro de Docker
Set-EnvValue -EnvPath $envFile -Key "APP_URL" -Value "http://localhost:8000"
Set-EnvValue -EnvPath $envFile -Key "DB_CONNECTION" -Value "pgsql"
Set-EnvValue -EnvPath $envFile -Key "DB_HOST" -Value "postgres"
Set-EnvValue -EnvPath $envFile -Key "DB_PORT" -Value "5432"
Set-EnvValue -EnvPath $envFile -Key "DB_DATABASE" -Value $dbDatabase
Set-EnvValue -EnvPath $envFile -Key "DB_USERNAME" -Value $dbUsername
Set-EnvValue -EnvPath $envFile -Key "DB_PASSWORD" -Value $dbPassword
Set-EnvValue -EnvPath $envFile -Key "CORS_ALLOWED_ORIGINS" -Value "http://localhost:5173"
Write-Ok "Variables de entorno de Docker aseguradas en backend\.env."

# 3. Levantar contenedores
Invoke-Checked -Description "Construyendo e iniciando contenedores (docker compose up -d --build)" `
    -Executable "docker" -Arguments @("compose", "up", "-d", "--build")

# 4. Esperar a que PostgreSQL este listo
Write-Step "Esperando a que PostgreSQL este listo para aceptar conexiones"
# Usamos $env:DB_USERNAME si esta definido en el entorno; por defecto 'postgres'
# (el superusuario estandar de la imagen oficial), no 'root'. pg_isready solo
# verifica que el servidor acepte conexiones, y usar un usuario que no exista
# en la instancia real (por ejemplo si el volumen de datos ya existia de una
# instalacion previa con otro usuario) hace fallar la comprobacion.
$dbUserForCheck = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }
Write-Host "  Usando usuario '$dbUserForCheck' para pg_isready (variable DB_USERNAME)."

$maxRetries = 30
$ready = $false
Push-Location $RootDir
try {
    for ($i = 1; $i -le $maxRetries; $i++) {
        $pgResult = Invoke-NativeSafe -Executable "docker" `
            -Arguments @("compose", "exec", "-T", "postgres", "pg_isready", "-U", $dbUserForCheck) -Quiet
        if ($pgResult.ExitCode -eq 0) {
            $ready = $true
            break
        }
        Write-Host "  Intento $i/$maxRetries - PostgreSQL aun no responde, esperando 2s..."
        Start-Sleep -Seconds 2
    }
}
finally {
    Pop-Location
}
if (-not $ready) {
    Write-ErrorMsg "PostgreSQL no respondio a tiempo. Revisa 'docker compose logs postgres'."
    exit 1
}
Write-Ok "PostgreSQL esta listo."

# 5. Instalar dependencias de Composer
Invoke-Checked -Description "Instalando dependencias PHP (composer install)" `
    -Executable "docker" -Arguments @("compose", "exec", "-T", "app", "composer", "install", "--no-interaction", "--prefer-dist")

# 6. Generar APP_KEY
Invoke-Checked -Description "Generando clave de aplicacion (php artisan key:generate)" `
    -Executable "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "key:generate", "--force")

# 7. Migraciones + seeders
Invoke-Checked -Description "Ejecutando migraciones con datos iniciales (php artisan migrate:fresh --seed)" `
    -Executable "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "migrate:fresh", "--seed", "--force")

# 8. Frontend
Write-Step "Preparando frontend (React + Vite)"
if (-not (Test-Path $FrontendDir)) {
    Write-WarnMsg "No se encontro la carpeta frontend, se omite este paso."
}
else {
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        Write-Ok "Node.js/npm detectado localmente, se usara directamente."

        Push-Location $FrontendDir
        try {
            $npmInstall = Invoke-NativeSafe -Executable "npm" -Arguments @("install")
        }
        finally {
            Pop-Location
        }
        if ($npmInstall.ExitCode -ne 0) {
            Write-ErrorMsg "Fallo 'npm install' en frontend."
            exit 1
        }

        Push-Location $FrontendDir
        try {
            $npmBuild = Invoke-NativeSafe -Executable "npm" -Arguments @("run", "build")
        }
        finally {
            Pop-Location
        }
        if ($npmBuild.ExitCode -ne 0) {
            Write-WarnMsg "No se pudo generar el build de produccion del frontend. Puedes ejecutar 'npm run dev' manualmente para desarrollo."
        }
        else {
            Write-Ok "Build de frontend generado en frontend\dist."
        }
    }
    else {
        Write-WarnMsg "No se encontro Node.js/npm en el sistema. Se usara una imagen temporal de Docker para instalar dependencias."
        $dockerNpm = Invoke-NativeSafe -Executable "docker" `
            -Arguments @("run", "--rm", "-v", "${FrontendDir}:/app", "-w", "/app", "node:20-alpine", "npm", "install")
        if ($dockerNpm.ExitCode -ne 0) {
            Write-WarnMsg "No se pudieron instalar las dependencias del frontend automaticamente. Instala Node.js (https://nodejs.org) y ejecuta 'npm install' y 'npm run dev' dentro de la carpeta frontend."
        }
        else {
            Write-Ok "Dependencias del frontend instaladas mediante Docker."
            Write-WarnMsg "Para desarrollar el frontend necesitas Node.js instalado localmente (para 'npm run dev'). El backend funciona sin el."
        }
    }
}

# 9. Mensaje final
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "   SistemaCasita esta listo para usarse" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API Backend:     http://localhost:8000" -ForegroundColor White
Write-Host "  pgAdmin:         http://localhost:5050  ($pgadminEmail / clave PGADMIN_PASSWORD en .env)" -ForegroundColor White
Write-Host "  Frontend (dev):  http://localhost:5173   (ejecuta 'cd frontend; npm run dev')" -ForegroundColor White
Write-Host ""
Write-Host "Para detener el sistema ejecuta: docker compose down" -ForegroundColor DarkGray
Write-Host ""
