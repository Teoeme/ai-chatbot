import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        if(!decoded){
            return res.status(401).json({ message: 'Token inválido' });
        }
        // @ts-ignore
        req.user = decoded;
        next();
    } catch (error) {
        console.log(error,'Error al verificar el token');
        return res.status(401).json({ message: 'Token inválido' });
    }
}; 