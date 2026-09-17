@echo off
title Warhammer 40,000: Wrath & Glory VTT
echo ====================================================
echo  WARHAMMER 40,000: WRATH & GLORY - VTT & GERENCIADOR
echo ====================================================
echo.
echo Iniciando o servidor de backend (porta 3001)...
start "W&G VTT Backend Server" cmd /k "cd server && node src/index.js"

echo Iniciando a aplicacao web frontend (porta 5173)...
start "W&G VTT Web Client" cmd /k "cd client && npm run dev -- --host"

echo.
echo ====================================================
echo  Sistema iniciado com sucesso!
echo  Acesse no seu navegador: http://localhost:5173
echo  Para outros jogadores na mesma rede: http://<SEU_IP_LOCAL>:5173
echo ====================================================
pause
