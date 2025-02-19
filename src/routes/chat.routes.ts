import { Router } from 'express';
import { chatController, transcribeController } from '../controllers/chat.controller';
import { RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', authMiddleware as RequestHandler, chatController as RequestHandler);
router.post('/transcribe', authMiddleware as RequestHandler, transcribeController as RequestHandler);

export default router; 