# BikeJJ - Script de Inicialização do Servidor
# PowerShell version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BikeJJ - Iniciando Servidor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "server.py")) {
    Write-Host "ERRO: Arquivo server.py não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script no diretório do projeto BikeJJ" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se Python está disponível
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Python não encontrado!" -ForegroundColor Red
    Write-Host "Instale Python 3.8 ou superior" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se o ambiente virtual existe
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "ERRO: Ambiente virtual não encontrado!" -ForegroundColor Red
    Write-Host "Execute os seguintes comandos:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor White
    Write-Host "  venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  pip install -r requirements.txt" -ForegroundColor White
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Verificar se a porta 9000 está em uso
$portInUse = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "AVISO: Porta 9000 já está em uso!" -ForegroundColor Yellow
    Write-Host "Pode ser que o servidor já esteja rodando." -ForegroundColor Yellow
    Write-Host ""
}

# Iniciar servidor
Write-Host "Iniciando servidor BikeJJ..." -ForegroundColor Green
Write-Host ""
Write-Host "O servidor será iniciado na porta 9000" -ForegroundColor Cyan
Write-Host "Acesse: http://localhost:9000" -ForegroundColor Cyan
Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Executar servidor
python server.py

Read-Host "Pressione Enter para sair"
