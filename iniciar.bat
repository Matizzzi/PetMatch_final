@echo off
title PetMatch - Iniciar Plataforma
echo ========================================================
echo        INICIANDO PETMATCH CON DOCKER
echo ========================================================
echo Levantando Frontend, Backend y Base de Datos...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo iniciar Docker Compose. Asegurate de que Docker Desktop este abierto.
    pause
    exit /b %errorlevel%
)
echo.
echo ========================================================
echo   PetMatch iniciado correctamente!
echo   - Frontend Web:     http://localhost:3000
echo   - Backend API:      http://localhost:8000
echo   - Swagger Docs:     http://localhost:8000/docs
echo   - pgAdmin:          http://localhost:5050
echo ========================================================
echo Abriendo aplicacion en el navegador...
start http://localhost:3000
pause
