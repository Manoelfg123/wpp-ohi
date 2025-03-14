import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { validate } from '../middlewares/validators';
import { 
  createSessionSchema, 
  createSessionWithQRSchema,
  updateSessionSchema, 
  sessionIdSchema, 
  listSessionsSchema 
} from '../validators/session.validators';

const router = Router();

/**
 * @swagger
 * /api/sessions/create-with-qr:
 *   post:
 *     summary: Cria uma nova sessão e retorna o QR Code imediatamente
 *     description: |
 *       Cria uma nova sessão do WhatsApp e retorna o QR Code para autenticação em uma única chamada.
 *       Se a sessão já estiver conectada, retorna uma mensagem informativa.
 *       
 *       O QR Code retornado tem um tempo de expiração configurável através do parâmetro `qrTimeout` 
 *       no objeto de configuração. Se não especificado, o padrão é 60 segundos.
 *       
 *       Após a criação da sessão, você pode monitorar seu status através do endpoint GET /sessions/{id}
 *       para verificar quando a autenticação for concluída.
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionCreate'
 *           example:
 *             name: "Nova Sessão"
 *             config:
 *               qrTimeout: 60000
 *               restartOnAuthFail: true
 *             webhookUrl: "https://exemplo.com/webhook"
 *     responses:
 *       201:
 *         description: Sessão criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionWithQRResponse'
 *             example:
 *               status: "success"
 *               data:
 *                 session:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "Nova Sessão"
 *                   status: "qr_ready"
 *                   config:
 *                     qrTimeout: 60000
 *                     restartOnAuthFail: true
 *                   createdAt: "2023-01-01T00:00:00.000Z"
 *                   updatedAt: "2023-01-01T00:00:00.000Z"
 *                 qrcode:
 *                   qrcode: "data:image/png;base64,..."
 *                   expiresIn: 60
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       408:
 *         description: Timeout ao gerar QR Code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               message: "Timeout ao gerar QR Code"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-with-qr', validate(createSessionWithQRSchema), sessionController.createSessionWithQR);

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Cria uma nova sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionCreate'
 *     responses:
 *       201:
 *         description: Sessão criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createSessionSchema), sessionController.createSession);

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Lista todas as sessões
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/SessionStatus'
 *         description: Filtrar por status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Página
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limite de itens por página
 *         default: 10
 *     responses:
 *       200:
 *         description: Lista de sessões
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionsList'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validate(listSessionsSchema), sessionController.listSessions);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Obtém uma sessão pelo ID
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Sessão encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validate(sessionIdSchema), sessionController.getSession);

/**
 * @swagger
 * /api/sessions/{id}/info:
 *   get:
 *     summary: Obtém informações detalhadas de uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Informações da sessão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionDetail'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/info', validate(sessionIdSchema), sessionController.getSessionInfo);

/**
 * @swagger
 * /api/sessions/{id}/qrcode:
 *   get:
 *     summary: Obtém o QR Code de uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: QR Code da sessão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/QRCodeResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/qrcode', validate(sessionIdSchema), sessionController.getSessionQRCode);

/**
 * @swagger
 * /api/sessions/{id}:
 *   patch:
 *     summary: Atualiza uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionUpdate'
 *     responses:
 *       200:
 *         description: Sessão atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', validate(updateSessionSchema), sessionController.updateSession);

/**
 * @swagger
 * /api/sessions/{id}/disconnect:
 *   post:
 *     summary: Desconecta uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Sessão desconectada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionStatusResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/disconnect', validate(sessionIdSchema), sessionController.disconnectSession);

/**
 * @swagger
 * /api/sessions/{id}/reconnect:
 *   post:
 *     summary: Reconecta uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       200:
 *         description: Reconexão iniciada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/SessionStatusResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/reconnect', validate(sessionIdSchema), sessionController.reconnectSession);

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Remove uma sessão
 *     tags: [Sessões]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID da sessão
 *     responses:
 *       204:
 *         description: Sessão removida com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sessão não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', validate(sessionIdSchema), sessionController.deleteSession);

export default router;
