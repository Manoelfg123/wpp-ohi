param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("up", "down", "build", "logs", "status", "clean")]
    [string]$Command
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Status {
    Write-ColorOutput Green "=== Status dos Containers ==="
    docker-compose ps
}

function Show-Logs {
    Write-ColorOutput Green "=== Logs dos Containers ==="
    docker-compose logs --tail=100 -f
}

switch ($Command) {
    "up" {
        Write-ColorOutput Green "=== Iniciando os containers ==="
        docker-compose up -d
        Show-Status
    }
    "down" {
        Write-ColorOutput Yellow "=== Parando os containers ==="
        docker-compose down
    }
    "build" {
        Write-ColorOutput Green "=== Construindo e iniciando os containers ==="
        docker-compose up -d --build
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "clean" {
        Write-ColorOutput Red "=== Removendo containers, volumes e imagens ==="
        docker-compose down -v --rmi all
    }
}
