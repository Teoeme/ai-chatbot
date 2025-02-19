import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { config } from '../config/config';
import { join } from 'path';
import os from 'os';
import { unlink } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { FileState, UploadFileResponse } from '@google/generative-ai/server';
import { UploadedFile } from '../types/files.types';

export class GeminiService {
    private initialPrompt = `
   Eres un asistente virtual de Alte Workshop, una empresa que ofrece servicios de desarrollo de software. Debes responder preguntas sobre la empresa y sus servicios con un lenguaje amigable y profesional, manteniendo respuestas claras y directas.

### Contexto de la empresa:
- **Nombre**: Alte Workshop
- **Servicios**:
  - Desarrollo de software a medida
  - Desarrollo de aplicaciones de escritorio, web y móviles
- **Ubicación**: Córdoba capital, Argentina
- **Página web**: https://alteworkshop.com
- **Email**: contact@alteworkshop.com

### Contexto del cliente:
- **Nombre del cliente**: (No lo sabemos, debes preguntarle)
- **Servicio contratado**: Aun no se ha contratado ningún servicio ni encargado proyectos.

### Reglas de comportamiento:
1. **Personalización y manejo del nombre**:
   - Usa el nombre del cliente solo en los momentos iniciales de la conversación o en situaciones formales. **No lo repitas innecesariamente** en cada respuesta.
   - No uses el apellido salvo en situaciones formales o si el cliente lo solicita.
   
2. **Saludo**:
   - **Saluda solo una vez por sesión** o si han pasado más de 2 horas desde el último mensaje. Si ya saludaste, no vuelvas a hacerlo hasta que corresponda.
   - Usa un tono amigable pero natural, evita modismos repetitivos que denoten que eres un robot.

3. **Historial y respuestas coherentes**:
   - Sigue el historial de conversación para mantener coherencia.
   - No repitas respuestas anteriores, varía las respuestas para ser más natural.

4. **Manejo de información**:
   - No uses la información del proyecto o servicio del cliente para responder preguntas a menos que te lo pidan explícitamente.
   - Nunca compartas información privada del cliente a menos que él lo solicite.
   - No respondas a preguntas fuera de tu conocimiento. Indica que alguien del equipo de Alte Workshop se pondrá en contacto.

5. **Límites y precisión**:
   - No prometas servicios o acciones que no puedes realizar (ej. acceso a la base de datos).
   - Si no sabes una respuesta, pide disculpas por la limitación y dirige al equipo.
   - Responde de forma amena a saludos como "Gracias" o "Hasta luego" sin sugerir siempre contacto con el equipo, a menos que sea necesario.
   - La información disponible es la que se te proporcionó hasta el momento, no habrá más información que esa.

6. **Restricciones importantes**:
   - No indagues más allá de lo necesario. Responde solo a lo que se te pide.
   - Si el cliente pregunta algo que no está relacionado con su servicio, indica que debe contactar al equipo.
   - Todas las respuestas se enviarán al cliente; asegúrate de no hablar en tercera persona o hacer referencia a otras conversaciones internas.

### Historial de conversación:
- **from**: Cliente o asistente.
- **content**: Mensaje enviado.
- **fecha**: Tiempo transcurrido desde el mensaje hasta ahora.

**Historial:** 
{{messages}} 

Sigue estas reglas estrictamente. No te desvíes de ellas.
`

    private genAi: GoogleGenerativeAI;
    private model;
    private fileManager: GoogleAIFileManager;
    constructor() {
        this.genAi = new GoogleGenerativeAI(config.geminiApiKey!);
        this.model = this.genAi.getGenerativeModel({ model: "gemini-pro" });
        this.fileManager = new GoogleAIFileManager(config.geminiApiKey!);
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

    async generateContent(messages:{
        from:'cliente'|'empresa',
        content:string,
        fecha:string
    }[]):Promise<string>{
        try{
        const prompt = this.initialPrompt.replace('{{messages}}', JSON.stringify(messages));
        const response = await this.model.generateContent(prompt);
        return response.response.text();
    }catch(error){
        console.error('Error en la generación de contenido:', error);
        return '';
    }
    }

    async transcribeAudio(uploadFile: UploadedFile): Promise<string> {
        try {
            // 1. Subir el archivo
            const uploadRes = await this.uploadFile(uploadFile);
            if (!uploadRes) {
                console.error('No se pudo subir el archivo de audio');
                return '';
            }

            // 2. Esperar a que el archivo esté procesado
            let fileInStorage = await this.fileManager.getFile(uploadRes.file.name);
            let attempts = 0;
            const maxAttempts = 12; // 2 minutos máximo de espera

            while (fileInStorage.state === FileState.PROCESSING && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
                fileInStorage = await this.fileManager.getFile(uploadRes.file.name);
                attempts++;
            }

            if (fileInStorage.state === FileState.FAILED) {
                throw new Error('Error al procesar el archivo de audio');
            }

            if (fileInStorage.state === FileState.PROCESSING) {
                throw new Error('Tiempo de procesamiento excedido');
            }

            // 3. Generar la transcripción
            const model = this.genAi.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = [
                {
                    text: "Transcribe el siguiente audio a texto en español. Incluye solo el contenido transcrito, sin comentarios adicionales."
                },
                {
                    fileData: {
                        fileUri: uploadRes.file.uri,
                        mimeType: uploadRes.file.mimeType
                    }
                }
            ];

            const result = await model.generateContent(prompt);
            const transcription = await result.response.text();

            // 4. Limpiar el archivo después de usarlo
            try {
                await this.fileManager.deleteFile(uploadRes.file.name);
            } catch (error) {
                console.error('Error al eliminar el archivo temporal:', error);
            }

            return transcription || '';

        } catch (error) {
            console.error('Error en la transcripción:', error);
            return '';
        }
    }
    
    private async uploadFile(uploadFile: UploadedFile): Promise<UploadFileResponse | null> {
        try {
            if (!uploadFile.url) {
                console.error('URL del archivo no disponible');
                return null;
            }

            // Descargar el archivo
            const response = await fetch(uploadFile.url);
            if (!response.ok) {
                throw new Error('No se pudo descargar el archivo');
            }

            // Obtener el buffer del archivo
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Generar un ID corto para el archivo (solo caracteres permitidos)
            const shortId = uploadFile.id
                .split('_')[0]
                .substring(0, 8)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '');
            
            // Crear nombres de archivo válidos
            const tempFileName = `${uploadFile.resource_type}-${shortId}`;
            const uploadFileName = `${uploadFile.resource_type}-${shortId}`;

            // Crear un archivo temporal
            const tempFilePath = join(os.tmpdir(), tempFileName);
            await writeFile(tempFilePath, buffer);

            // Subir el archivo usando el path temporal
            const uploadResult = await this.fileManager.uploadFile(tempFilePath, {
                mimeType: uploadFile.mime_type,
                name: uploadFileName
            });

            // Limpiar el archivo temporal
            try {
                await unlink(tempFilePath);
            } catch (error) {
                console.error('Error al eliminar archivo temporal:', error);
            }

            return uploadResult;

        } catch (error) {
            console.error('Error al subir el archivo:', error);
            return null;
        }
    }
    


} 