@echo off
title PetMatch - Detener
cd /d "%~dp0"
echo Deteniendo contenedores (los datos de Postgres se conservan)...
docker compose down
echo Listo.
pause
