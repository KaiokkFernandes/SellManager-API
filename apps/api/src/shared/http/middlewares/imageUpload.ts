import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';
import uploadConfig from '@config/upload';
import { detectImageType } from '@shared/domain/imageType';
import AppError from '@shared/errors/AppError';

/** Troca o tipo declarado pelo cliente pelo tipo real, lido do conteúdo. */
function confirmImageContent(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (!request.file) return next();

  const type = detectImageType(request.file.buffer);
  if (!type) {
    return next(
      new AppError('File content is not a valid image', 400, {
        code: 'INVALID_UPLOAD',
      }),
    );
  }
  request.file.mimetype = type;
  next();
}

/** Recebe a imagem do campo em memória, já validada por tipo e tamanho. */
export function imageUpload(field: string): RequestHandler[] {
  return [multer(uploadConfig.multer).single(field), confirmImageContent];
}
