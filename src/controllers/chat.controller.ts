import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';

const geminiService = new GeminiService();

export const chatController = async (req: Request, res: Response) => {
    try {
        const { message, messages } = req.body;
        
        if (messages) {
            const response = await geminiService.generateContent(messages);
            return res.json({ response });
        }

        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }

        const response = await geminiService.generateResponse(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
};

export const transcribeController = async (req: Request, res: Response) => {
    try {
        const { file } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'El archivo es requerido' });
        }

        const transcription = await geminiService.transcribeAudio(file);
        
        if (!transcription) {
            return res.status(422).json({ error: 'No se pudo transcribir el audio' });
        }

        res.json({ transcription });
    } catch (error) {
        res.status(500).json({ error: 'Error al transcribir el audio' });
    }
}; 