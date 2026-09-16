@echo off
setlocal EnableDelayedExpansion
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale Node.js 18+ e execute este script novamente.
  pause
  exit /b 1
)

echo Instalando dependencias, se necessario...
if not exist "%BACKEND_DIR%\node_modules" (
  echo [1/2] Instalando backend...
  cd /d "%BACKEND_DIR%"
  call npm install --no-audit --no-fund
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [2/2] Instalando frontend...
  cd /d "%FRONTEND_DIR%"
  call npm install --no-audit --no-fund
)

echo.
echo Iniciando backend...
start "Backend" cmd /c "cd /d ""%BACKEND_DIR%"" && npm start"

echo Iniciando frontend...
start "Frontend" cmd /c "cd /d ""%FRONTEND_DIR%"" && npm run dev -- --host 0.0.0.0 --port 5175"

echo Aguardando o sistema ficar pronto...
for /l %%i in (1,1,30) do (
  powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } } catch { } exit 1" >nul 2>&1
  if not errorlevel 1 goto ready
  timeout /t 2 >nul
)

:ready
echo.
echo Sistema iniciado com sucesso!
echo Frontend: http://localhost:5175
echo Backend:  http://localhost:3001

echo.
echo Credenciais padrao:
echo Login: Rodrigo Campos
echo Senha: 100769

echo.
start "" http://localhost:5175/
pause
exit /b 0
