@echo off
setlocal enabledelayedexpansion

:: Cores para saída (Windows)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %YELLOW%=== API SaaS para WhatsApp Multi-Session ===%NC%
echo %YELLOW%Iniciando configuração e execução do projeto...%NC%

:: Verificar se o Docker está instalado
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%Docker não encontrado. Por favor, instale o Docker antes de continuar.%NC%
    exit /b 1
)

:: Verificar se o Docker Compose está instalado
docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %RED%Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.%NC%
    exit /b 1
)

:: Verificar se o arquivo .env existe
if not exist .env (
    echo %YELLOW%Arquivo .env não encontrado. Criando a partir do .env.example...%NC%
    copy .env.example .env >nul
    echo %GREEN%Arquivo .env criado com sucesso!%NC%
    echo %YELLOW%Por favor, edite o arquivo .env com suas configurações antes de continuar.%NC%
    echo %YELLOW%Pressione Enter para continuar ou Ctrl+C para cancelar...%NC%
    pause >nul
)

:: Criar diretório de sessões se não existir
if not exist sessions (
    echo %YELLOW%Criando diretório para sessões do WhatsApp...%NC%
    mkdir sessions
    echo %GREEN%Diretório de sessões criado com sucesso!%NC%
)

:: Construir e iniciar os containers
echo %YELLOW%Construindo e iniciando os containers Docker...%NC%
docker-compose up -d --build

:: Verificar se os containers foram iniciados com sucesso
if %ERRORLEVEL% equ 0 (
    echo %GREEN%Containers iniciados com sucesso!%NC%
    
    :: Aguardar um pouco para os serviços inicializarem
    echo %YELLOW%Aguardando serviços inicializarem...%NC%
    timeout /t 5 /nobreak >nul
    
    :: Executar migrações do banco de dados
    echo %YELLOW%Executando migrações do banco de dados...%NC%
    docker-compose exec api npm run migration:run
    
    if %ERRORLEVEL% equ 0 (
        echo %GREEN%Migrações executadas com sucesso!%NC%
    ) else (
        echo %RED%Erro ao executar migrações. Verifique os logs para mais detalhes.%NC%
    )
    
    :: Exibir informações de acesso
    for /f "tokens=2 delims==" %%a in ('findstr /C:"PORT=" .env') do set API_PORT=%%a
    if "!API_PORT!"=="" set API_PORT=3000
    
    echo.
    echo %GREEN%=== Projeto iniciado com sucesso! ===%NC%
    echo %GREEN%API está rodando em:%NC% http://localhost:!API_PORT!
    echo %GREEN%Documentação Swagger:%NC% http://localhost:!API_PORT!/api-docs
    echo %GREEN%Interface do RabbitMQ:%NC% http://localhost:15672 (guest/guest)
    echo.
    echo %YELLOW%Para visualizar os logs:%NC% docker-compose logs -f api
    echo %YELLOW%Para parar os serviços:%NC% docker-compose down
) else (
    echo %RED%Erro ao iniciar os containers. Verifique os logs para mais detalhes.%NC%
)

endlocal
