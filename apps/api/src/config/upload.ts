import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import AppError from '@shared/errors/AppError';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

// Extensão definida pelo tipo aceito, nunca pelo nome enviado pelo cliente.
const allowedImageTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

export default {
  tmpFolder,
  uploadsFolder: path.resolve(tmpFolder, 'uploads'),

  multer: {
    storage: multer.diskStorage({
      destination: tmpFolder,
      filename: (_request, file, callback) => {
        const fileHash = crypto.randomBytes(16).toString('hex');
        callback(null, `${fileHash}${allowedImageTypes[file.mimetype]}`);
      },
    }),
    limits: { fileSize: MAX_AVATAR_SIZE, files: 1 },
    fileFilter: (
      _request: Express.Request,
      file: Express.Multer.File,
      callback: multer.FileFilterCallback,
    ) => {
      if (!(file.mimetype in allowedImageTypes)) {
        return callback(
          new AppError('Invalid file type. Allowed: jpeg, png, webp', 400),
        );
      }
      callback(null, true);
    },
  } satisfies multer.Options,
};
