@echo off
REM Navigate to the directory of this batch file
cd /d %~dp0

REM Start Node.js server in a new window
start cmd /k "node server.js"

REM Give the server a moment to start
timeout /t 2 /nobreak >nul

REM Open the Public Viewer
start http://localhost:3000/index.html