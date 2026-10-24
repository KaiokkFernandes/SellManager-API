import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './router';
import AppError from '../erros/AppError';
import upload from '@config/upload';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/files', express.static(upload.directory));
app.use(routes);

// Middleware para tratamento de erros
app.use(
  (
    error: AppError | Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ): void => {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        status: 'error',
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      });
      return;
    }

    console.error('Erro não tratado:', error);
    response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  },
);

export default app;
