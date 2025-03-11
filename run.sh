#!/bin/bash

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== API SaaS para WhatsApp Multi-Session ===${NC}"
echo -e "${YELLOW}Iniciando configuração e execução do projeto...${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker antes de continuar.${NC}"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Arquivo .env não encontrado. Criando a partir do .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Arquivo .env criado com sucesso!${NC}"
    echo -e "${YELLOW}Por favor, edite o arquivo .env com suas configurações antes de continuar.${NC}"
    echo -e "${YELLOW}Pressione Enter para continuar ou Ctrl+C para cancelar...${NC}"
    read
fi

# Criar diretório de sessões se não existir
if [ ! -d "sessions" ]; then
    echo -e "${YELLOW}Criando diretório para sessões do WhatsApp...${NC}"
    mkdir -p sessions
    echo -e "${GREEN}Diretório de sessões criado com sucesso!${NC}"
fi

# Construir e iniciar os containers
echo -e "${YELLOW}Construindo e iniciando os containers Docker...${NC}"
docker-compose up -d --build

# Verificar se os containers foram iniciados com sucesso
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Containers iniciados com sucesso!${NC}"
    
    # Aguardar um pouco para os serviços inicializarem
    echo -e "${YELLOW}Aguardando serviços inicializarem...${NC}"
    sleep 5
    
    # Executar migrações do banco de dados
    echo -e "${YELLOW}Executando migrações do banco de dados...${NC}"
    docker-compose exec api npm run migration:run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Migrações executadas com sucesso!${NC}"
    else
        echo -e "${RED}Erro ao executar migrações. Verifique os logs para mais detalhes.${NC}"
    fi
    
    # Exibir informações de acesso
    API_PORT=$(grep "PORT=" .env | cut -d '=' -f2 || echo "3000")
    
    echo -e "\n${GREEN}=== Projeto iniciado com sucesso! ===${NC}"
    echo -e "${GREEN}API está rodando em:${NC} http://localhost:${API_PORT}"
    echo -e "${GREEN}Documentação Swagger:${NC} http://localhost:${API_PORT}/api-docs"
    echo -e "${GREEN}Interface do RabbitMQ:${NC} http://localhost:15672 (guest/guest)"
    echo -e "\n${YELLOW}Para visualizar os logs:${NC} docker-compose logs -f api"
    echo -e "${YELLOW}Para parar os serviços:${NC} docker-compose down"
else
    echo -e "${RED}Erro ao iniciar os containers. Verifique os logs para mais detalhes.${NC}"
fi
