import crypto from 'node:crypto';
import path from 'node:path';
import {
  IMAGE_UPLOAD,
  isAllowedImageType,
  type ImageMimeType,
} from '@sellmanager/shared';
import multer from 'multer';
import AppError from '@shared/errors/AppError';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

// Extensão definida pelo tipo aceito, nunca pelo nome enviado pelo cliente.
// Limites vêm de @sellmanager/shared (os mesmos que o front valida).
const extensions: Record<ImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export default {
  tmpFolder,
  uploadsFolder: path.resolve(tmpFolder, 'uploads'),

  multer: {
    storage: multer.diskStorage({
      destination: tmpFolder,
      filename: (_request, file, callback) => {
        const fileHash = crypto.randomBytes(16).toString('hex');
        const extension = isAllowedImageType(file.mimetype)
          ? extensions[file.mimetype]
          : '';
        callback(null, `${fileHash}${extension}`);
      },
    }),
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
