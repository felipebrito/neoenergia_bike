@echo off
title BikeJJ - Sistema de Bicicletas
color 0A

echo.
echo ============================================================
echo    🚴 BikeJJ - Sistema de Bicicletas - Inicializacao
echo ============================================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nao encontrado!
    echo 💡 Instale Python 3.8+ e tente novamente
    pause
    exit /b 1
)

REM Verificar se estamos no diretório correto
if not exist "server.py" (
    echo ❌ Arquivo server.py nao encontrado!
    echo 💡 Execute este arquivo no diretório do projeto BikeJJ
    pause
    exit /b 1
)

REM Ativar ambiente virtual se existir
if exist "venv\Scripts\activate.bat" (
    echo 🔧 Ativando ambiente virtual...
    call venv\Scripts\activate.bat
)

REM Executar script de inicialização
echo 🚀 Iniciando sistema BikeJJ...
python start_bikejj.py

REM Pausar para ver mensagens de erro se houver
if errorlevel 1 (
    echo.
    echo ❌ Erro ao iniciar o sistema!
    pause
)
