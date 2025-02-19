import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';

const geminiService = new GeminiService();

export const chatController = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        const response = await geminiService.generateResponse(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
}; 