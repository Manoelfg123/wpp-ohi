/**
 * @swagger
 * components:
 *   schemas:
 *     MessageType:
 *       type: string
 *       enum:
 *         - text
 *         - image
 *         - video
 *         - audio
 *         - document
 *         - location
 *         - contact
 *         - buttons
 *         - list
 *         - template
 *         - reaction
 *         - sticker
 *         - story
 *       example: text
 *
 *     MessageStatus:
 *       type: string
 *       enum:
 *         - pending
 *         - sent
 *         - delivered
 *         - read
 *         - failed
 *       example: sent
 *
 *     BaseMessageOptions:
 *       type: object
 *       properties:
 *         quoted:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID da mensagem a ser citada
 *               example: "123456789"
 *             type:
 *               type: string
 *               description: Tipo da mensagem citada
 *               example: "text"
 *
 *     TextMessage:
 *       type: object
 *       required:
 *         - to
 *         - text
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         text:
 *           type: string
 *           description: Conteúdo da mensagem de texto
 *           example: "Olá, como vai?"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     MediaMessage:
 *       type: object
 *       required:
 *         - to
 *         - type
 *         - media
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         type:
 *           type: string
 *           enum:
 *             - image
 *             - video
 *             - audio
 *             - document
 *           description: Tipo de mídia
 *           example: "image"
 *         media:
 *           type: string
 *           description: URL ou Base64 da mídia
 *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
 *         caption:
 *           type: string
 *           description: Legenda opcional para a mídia
 *           example: "Foto da reunião"
 *         options:
 *           type: object
 *           allOf:
 *             - $ref: '#/components/schemas/BaseMessageOptions'
 *             - type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                   description: Nome do arquivo
 *                   example: "documento.pdf"
 *                 mimetype:
 *                   type: string
 *                   description: Tipo MIME do arquivo
 *                   example: "application/pdf"
 *
 *     LocationMessage:
 *       type: object
 *       required:
 *         - to
 *         - latitude
 *         - longitude
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         latitude:
 *           type: number
 *           description: Latitude da localização
 *           example: -23.5505
 *         longitude:
 *           type: number
 *           description: Longitude da localização
 *           example: -46.6333
 *         name:
 *           type: string
 *           description: Nome do local
 *           example: "Avenida Paulista"
 *         address:
 *           type: string
 *           description: Endereço completo
 *           example: "Avenida Paulista, 1000, São Paulo - SP"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     ContactMessage:
 *       type: object
 *       required:
 *         - to
 *         - contact
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         contact:
 *           type: object
 *           required:
 *             - fullName
 *             - phoneNumber
 *           properties:
 *             fullName:
 *               type: string
 *               description: Nome completo do contato
 *               example: "João Silva"
 *             phoneNumber:
 *               type: string
 *               description: Número de telefone do contato
 *               example: "5511888888888"
 *             organization:
 *               type: string
 *               description: Organização do contato
 *               example: "Empresa XYZ"
 *             email:
 *               type: string
 *               description: Email do contato
 *               example: "joao@exemplo.com"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     ButtonMessage:
 *       type: object
 *       required:
 *         - to
 *         - text
 *         - buttons
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         text:
 *           type: string
 *           description: Texto principal da mensagem
 *           example: "Escolha uma opção:"
 *         footer:
 *           type: string
 *           description: Texto de rodapé
 *           example: "Responda clicando em um botão"
 *         buttons:
 *           type: array
 *           description: Lista de botões
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - text
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID único do botão
 *                 example: "btn_1"
 *               text:
 *                 type: string
 *                 description: Texto do botão
 *                 example: "Opção 1"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     ListMessage:
 *       type: object
 *       required:
 *         - to
 *         - text
 *         - buttonText
 *         - sections
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         text:
 *           type: string
 *           description: Texto principal da mensagem
 *           example: "Escolha uma opção:"
 *         footer:
 *           type: string
 *           description: Texto de rodapé
 *           example: "Selecione uma opção da lista"
 *         title:
 *           type: string
 *           description: Título da lista
 *           example: "Menu de opções"
 *         buttonText:
 *           type: string
 *           description: Texto do botão que abre a lista
 *           example: "Ver opções"
 *         sections:
 *           type: array
 *           description: Seções da lista
 *           items:
 *             type: object
 *             required:
 *               - title
 *               - rows
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título da seção
 *                 example: "Produtos"
 *               rows:
 *                 type: array
 *                 description: Itens da seção
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - title
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID único do item
 *                       example: "item_1"
 *                     title:
 *                       type: string
 *                       description: Título do item
 *                       example: "Produto A"
 *                     description:
 *                       type: string
 *                       description: Descrição do item
 *                       example: "Descrição do Produto A"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     ReactionMessage:
 *       type: object
 *       required:
 *         - to
 *         - messageId
 *         - reaction
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         messageId:
 *           type: string
 *           description: ID da mensagem a reagir
 *           example: "123456789"
 *         reaction:
 *           type: string
 *           description: Emoji de reação
 *           example: "👍"
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     StickerMessage:
 *       type: object
 *       required:
 *         - to
 *         - sticker
 *       properties:
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         sticker:
 *           type: string
 *           description: URL ou Base64 do sticker
 *           example: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4..."
 *         options:
 *           $ref: '#/components/schemas/BaseMessageOptions'
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da mensagem no sistema
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         messageId:
 *           type: string
 *           description: ID da mensagem no WhatsApp
 *           example: "3EB0C767D097B7C1C5"
 *         sessionId:
 *           type: string
 *           format: uuid
 *           description: ID da sessão que enviou a mensagem
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *         to:
 *           type: string
 *           description: Número de telefone do destinatário
 *           example: "5511999999999"
 *         type:
 *           $ref: '#/components/schemas/MessageType'
 *         status:
 *           $ref: '#/components/schemas/MessageStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da mensagem
 *           example: "2023-01-01T00:00:00.000Z"
 *         metadata:
 *           type: object
 *           description: Metadados adicionais da mensagem
 *           example: { "source": "api", "priority": "high" }
 *
 *     MessageDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/MessageResponse'
 *         - type: object
 *           properties:
 *             content:
 *               type: object
 *               description: Conteúdo da mensagem
 *               example: { "text": "Olá, como vai?" }
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Data da última atualização da mensagem
 *               example: "2023-01-01T00:05:00.000Z"
 *             deliveredAt:
 *               type: string
 *               format: date-time
 *               description: Data de entrega da mensagem
 *               example: "2023-01-01T00:01:00.000Z"
 *             readAt:
 *               type: string
 *               format: date-time
 *               description: Data de leitura da mensagem
 *               example: "2023-01-01T00:02:00.000Z"
 */
