@echo off
title Makro Hub - Servidor Local
echo.
echo   Iniciando servidor local do Makro Hub...
echo   Acesse: http://localhost:5000
echo   Pressione Ctrl+C para parar.
echo.
cd /d "%~dp0"
npx serve -l tcp://0.0.0.0:5000 --no-clipboard --no-request-logging
pause
