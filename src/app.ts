import express from 'express';
import chatRoutes from './routes/chat.routes';
import { config } from './config/config';

const app = express();

app.use(express.json());
app.use('/api', chatRoutes);

app.listen(config.port, () => {
    console.log(`Servidor corriendo en el puerto ${config.port}`);
}); 