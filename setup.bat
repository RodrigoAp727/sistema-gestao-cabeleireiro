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
echo 1. Terminal 1 - Backend: cd backend && npm run dev
echo 2. Terminal 2 - Frontend: cd frontend && npm run dev
echo.
echo Acesse: http://localhost:3000
pause
