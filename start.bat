@echo off
title VantagePulse AI - Backend Server
echo ========================================================
echo   Starting VantagePulse AI Market Intelligence Backend
echo ========================================================
echo.

WHERE node >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
  node server.js
) ELSE (
  IF EXIST "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    "%APPDATA%\Antigravity\bin\agy-node.cmd" server.js
  ) ELSE (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js.
    pause
  )
)
