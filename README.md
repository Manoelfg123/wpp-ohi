# WhatsApp SaaS API

API para gerenciamento de sessões e envio de mensagens do WhatsApp.

## 🐳 Executando com Docker

### Pré-requisitos

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [PowerShell](https://docs.microsoft.com/pt-br/powershell/scripting/install/installing-powershell) (para Windows)

### Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
copy .env.example .env
```

2. Ajuste as variáveis no arquivo `.env` conforme necessário.

### Gerenciamento dos Containers

O projeto inclui um script PowerShell para facilitar o gerenciamento dos containers. Você pode usar os seguintes comandos:

```powershell
# Iniciar os serviços
.\docker-manage.ps1 start

# Parar os serviços
.\docker-manage.ps1 stop

# Reiniciar os serviços
.\docker-manage.ps1 restart

# Visualizar logs
.\docker-manage.ps1 logs

# Reconstruir os containers (útil após alterações no código)
.\docker-manage.ps1 rebuild
```

### Portas Utilizadas

Os serviços estão configurados nas seguintes portas:

- **API**: 3000 (host) -> 3000 (container)
- **PostgreSQL**: 5432 (host) -> 5432 (container)
- **Redis**: 6379 (host) -> 6379 (container)
- **RabbitMQ**: 
  - AMQP: 5672 (host) -> 5672 (container)
  - Management UI: 15672 (host) -> 15672 (container)

### Volumes Persistentes

Os dados dos serviços são armazenados em volumes Docker nomeados:

- **PostgreSQL**: whatsapp-saas-postgres-data
- **Redis**: whatsapp-saas-redis-data
- **RabbitMQ**: whatsapp-saas-rabbitmq-data
- **Sessões WhatsApp**: ./sessions (mapeado diretamente para o host)

### Health Checks

Todos os serviços possuem health checks configurados para garantir que estejam funcionando corretamente:

- **API**: Verifica o endpoint /health a cada 30 segundos
- **PostgreSQL**: Verifica a conectividade do banco a cada 10 segundos
- **Redis**: Verifica o serviço com PING a cada 10 segundos
- **RabbitMQ**: Verifica a conectividade das portas a cada 30 segundos

### Acessando os Serviços

- **API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672
  - Username: guest
  - Password: guest

### Troubleshooting

Se encontrar problemas, tente as seguintes soluções:

1. Reconstrua os containers:
```powershell
.\docker-manage.ps1 rebuild
```

2. Verifique os logs:
```powershell
.\docker-manage.ps1 logs
```

3. Certifique-se de que todas as portas necessárias estão disponíveis e não estão sendo usadas por outros serviços.

4. Se necessário, limpe os volumes Docker:
```powershell
docker volume rm whatsapp-saas-postgres-data whatsapp-saas-redis-data whatsapp-saas-rabbitmq-data
```
**Atenção**: Este comando apagará todos os dados persistentes dos serviços.
