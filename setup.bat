@echo off
echo 🔧 Instalando dependências...

echo 📦 Backend...
cd backend
call npm install

echo 📦 Frontend...
cd ..\frontend
call npm install

echo.
echo ✅ Instalação concluída!
echo.
echo Para iniciar o sistema:
echo 1. Execute start-local.bat

echo.
echo Acesse: http://localhost:5175
pause
