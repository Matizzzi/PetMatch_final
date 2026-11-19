@echo off
title PetMatch - Iniciar
cd /d "%~dp0"

echo ========================================================
echo        PETMATCH - Arranque para cualquier PC
echo ========================================================

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Docker. Instala Docker Desktop y volve a intentar.
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop no esta en ejecucion. Abri Docker Desktop, espera a que este en verde, y corre este archivo de nuevo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo No hay .env — se copia .env.example (Postgres local, sin claves de IA).
    copy /Y ".env.example" ".env" >nul
)

echo.
echo Primera vez: 5 a 15 minutos (descarga imagenes y compila el front).
echo Siguientes veces: 30 a 90 segundos.
echo.

docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] docker compose fallo. Mira el mensaje de arriba.
    echo Si el puerto 3000, 8000, 5050 o 5432 esta ocupado, cierra ese programa y reintenta.
    pause
    exit /b %errorlevel%
)

echo.
echo Esperando a que el backend responda...
set /a _n=0
:wait_api
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/ -TimeoutSec 3).StatusCode } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto ready
set /a _n+=1
if %_n% geq 40 (
    echo [AVISO] El API todavia no responde. Abri Docker Desktop y mira los logs de petmatch_backend.
    goto urls
)
timeout /t 3 /nobreak >nul
goto wait_api

:ready
echo Backend OK.
:urls
echo.
echo ========================================================
echo  App web:     http://localhost:3000
echo  API:         http://localhost:8000
echo  Docs API:    http://localhost:8000/docs
echo  pgAdmin:     http://localhost:5050
echo               email: admin@petmatch.com
echo               clave: admin
echo  Postgres:    usuario petmatch_user  clave petmatch_password
echo ========================================================
echo El detalle paso a paso esta en MANUAL_TECNICO.md
echo.
start http://localhost:3000
pause
