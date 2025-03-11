import { Router } from 'express';
import sessionRoutes from './session.routes';
import messageRoutes from './message.routes';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Aplica o middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de sessão
router.use('/sessions', sessionRoutes);

// Rotas de mensagem (usam o mesmo prefixo de sessões)
router.use('/sessions', messageRoutes);

export default router;
