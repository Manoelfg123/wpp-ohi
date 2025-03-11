/**
 * @swagger
 * components:
 *   schemas:
 *     SessionStatus:
 *       type: string
 *       enum:
 *         - initializing
 *         - connecting
 *         - connected
 *         - disconnected
 *         - qr_ready
 *         - error
 *         - logged_out
 *       example: connected
 *
 *     SessionConfig:
 *       type: object
 *       properties:
 *         restartOnAuthFail:
 *           type: boolean
 *           description: Se deve tentar reconectar automaticamente em caso de falha de autenticação
 *           example: true
 *         maxRetries:
 *           type: number
 *           description: Número máximo de tentativas de reconexão
 *           example: 5
 *         browser:
 *           type: array
 *           description: Configuração do navegador para o WhatsApp Web
 *           items:
 *             type: string
 *           example: ["Chrome", "Windows", "10.0.0"]
 *         qrTimeout:
 *           type: number
 *           description: Tempo limite para leitura do QR Code em milissegundos
 *           example: 60000
 *
 *     SessionCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome da sessão
 *           example: "Cliente A"
 *         config:
 *           $ref: '#/components/schemas/SessionConfig'
 *         webhookUrl:
 *           type: string
 *           description: URL para receber webhooks de eventos da sessão
 *           example: "https://exemplo.com/webhook"
 *
 *     SessionUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome da sessão
 *           example: "Cliente A - Atualizado"
 *         config:
 *           $ref: '#/components/schemas/SessionConfig'
 *         webhookUrl:
 *           type: string
 *           description: URL para receber webhooks de eventos da sessão
 *           example: "https://exemplo.com/webhook-novo"
 *
 *     SessionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da sessão
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Nome da sessão
 *           example: "Cliente A"
 *         status:
 *           $ref: '#/components/schemas/SessionStatus'
 *         config:
 *           $ref: '#/components/schemas/SessionConfig'
 *         webhookUrl:
 *           type: string
 *           description: URL para receber webhooks de eventos da sessão
 *           example: "https://exemplo.com/webhook"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da sessão
 *           example: "2023-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização da sessão
 *           example: "2023-01-02T00:00:00.000Z"
 *
 *     SessionDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/SessionResponse'
 *         - type: object
 *           properties:
 *             clientInfo:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                   description: Plataforma do dispositivo
 *                   example: "android"
 *                 phoneNumber:
 *                   type: string
 *                   description: Número de telefone associado à sessão
 *                   example: "5511999999999"
 *                 deviceManufacturer:
 *                   type: string
 *                   description: Fabricante do dispositivo
 *                   example: "Samsung"
 *                 connectedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Data da última conexão
 *                   example: "2023-01-01T12:00:00.000Z"
 *
 *     SessionsList:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total de sessões
 *           example: 10
 *         page:
 *           type: number
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: number
 *           description: Limite de itens por página
 *           example: 10
 *         sessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SessionResponse'
 *
 *     QRCodeResponse:
 *       type: object
 *       properties:
 *         qrcode:
 *           type: string
 *           description: String do QR Code para autenticação
 *           example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *         expiresIn:
 *           type: number
 *           description: Tempo de expiração em segundos
 *           example: 60
 *
 *     SessionStatusResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da sessão
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         status:
 *           $ref: '#/components/schemas/SessionStatus'
 *         message:
 *           type: string
 *           description: Mensagem descritiva sobre o status
 *           example: "Sessão desconectada com sucesso"
 *
 *     SessionWithQRResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             session:
 *               $ref: '#/components/schemas/SessionResponse'
 *             qrcode:
 *               $ref: '#/components/schemas/QRCodeResponse'
 *             message:
 *               type: string
 *               description: Mensagem informativa (quando a sessão já está conectada)
 *               example: "Sessão já está conectada"
 */
