import path from 'node:path';
import { IMAGE_UPLOAD, isAllowedImageType } from '@sellmanager/shared';
import multer from 'multer';
import AppError from '@shared/errors/AppError';

export default {
  // pasta do provider de disco (só desenvolvimento)
  uploadsFolder: path.resolve(__dirname, '..', '..', 'tmp', 'uploads'),

  // Em memória: o arquivo vai direto ao provider, e a função da Vercel não tem
  // disco durável. Limites vêm de @sellmanager/shared (os mesmos do front).
  multer: {
    storage: multer.memoryStorage(),
    limits: { fileSize: IMAGE_UPLOAD.maxBytes, files: 1 },
    fileFilter: (
      _request: Express.Request,
      file: Express.Multer.File,
      callback: multer.FileFilterCallback,
    ) => {
      if (!isAllowedImageType(file.mimetype)) {
        return callback(
          new AppError('Invalid file type. Allowed: jpeg, png, webp', 400, {
            code: 'INVALID_UPLOAD',
          }),
        );
      }
      callback(null, true);
    },
  } satisfies multer.Options,
};
