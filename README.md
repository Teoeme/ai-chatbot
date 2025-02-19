# AI Chatbot con Gemini

API de chatbot inteligente construida con Node.js, Express y Google Gemini AI, con capacidades de procesamiento de texto, transcripción de audio y despacho de eventos.

## Características

- 🤖 Integración con Google Gemini AI
- 🔐 Autenticación JWT
- 🎙️ Transcripción de audio a texto
- 💬 Manejo de conversaciones con contexto
- 🔄 Despacho de eventos (webhooks)

## Configuración

1. Clonar el repositorio:
bash
git clone https://github.com/tu-usuario/ai-chatbot.git
cd ai-chatbot
2. Instalar dependencias:
bash
npm install
3. Configurar variables de entorno en `.env`:
plaintext
PORT=3001
GEMINI_API_KEY=tu-api-key-de-gemini
JWT_SECRET=tu-secreto-jwt

4. Ejecutar en desarrollo:
bash
npm run dev

## API Endpoints

### Chat Simple
Envía un mensaje simple al chatbot.

http
POST /api/chat
Authorization: Bearer <token>
{
"message": "¿Qué servicios ofrecen?"
}


### Chat con Contexto
Envía una conversación con historial.
http
POST /api/chat
Authorization: Bearer <token>
{
"messages": [
{
"from": "cliente",
"content": "Hola, me llamo Juan",
"fecha": "2024-03-19T10:00:00Z"
}
]
}


### Transcripción de Audio
Convierte audio a texto.
http
POST /api/transcribe
Authorization: Bearer <token>
{
"file": {
"id": "audio_123",
"url": "https://ejemplo.com/audio.mp3",
"mime_type": "audio/mp3",
"resource_type": "audio"
}
}


## Tipos de Archivos Soportados

- Audio: `audio/mp3`, `audio/wav`, `audio/ogg`
- Duración máxima: 2 minutos
- Tamaño máximo: 10MB

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 400 | Error en la petición |
| 401 | No autorizado |
| 422 | Error de procesamiento |
| 500 | Error del servidor |

## Desarrollo


Modo desarrollo
npm run dev
Compilar TypeScript
npm run build
Ejecutar producción
npm start
