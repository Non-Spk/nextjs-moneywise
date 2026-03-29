@echo off
title MoneyWise
cd /d "%~dp0"

echo Starting MoneyWise server...
start /b cmd /c "npm run dev"

:wait
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:3000 2>nul
if errorlevel 1 (
    echo Waiting for server...
    goto wait
)

echo Server is ready!
start "" http://localhost:3000
