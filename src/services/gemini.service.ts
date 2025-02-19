import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

export class GeminiService {
    private model;

    constructor() {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey!);
        this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error al generar respuesta:', error);
            throw error;
        }
    }
} 