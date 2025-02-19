import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { RequestHandler } from 'express';

const router = Router();

router.post('/chat', chatController as RequestHandler);

export default router; 