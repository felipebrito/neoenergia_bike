@echo off
echo ========================================
echo BikeJJ - Iniciando Servidor
echo ========================================

REM Mudar para o diretório do projeto BikeJJ
cd /d "C:\Users\Brito\neoenergia_bike"

REM Verificar se estamos no diretório correto
if not exist "server.py" (
    echo ERRO: Arquivo server.py não encontrado!
    echo Diretório atual: %CD%
    echo Verifique se o caminho do projeto está correto
    pause
    exit /b 1
)

REM Verificar se Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python não encontrado!
    echo Instale Python 3.8 ou superior
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "venv\Scripts\activate.bat" (
    echo ERRO: Ambiente virtual não encontrado!
    echo Execute: python -m venv venv
    echo Depois: venv\Scripts\activate
    echo E instale: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Ativar ambiente virtual
echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Verificar se o servidor já está rodando
netstat -an | find "9000" >nul
if not errorlevel 1 (
    echo AVISO: Porta 9000 já está em uso!
    echo Pode ser que o servidor já esteja rodando.
    echo.
)

REM Iniciar servidor
echo Iniciando servidor BikeJJ...
echo.
echo O servidor será iniciado na porta 9000
echo Acesse: http://localhost:9000
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================

python server.py

pause
