import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  tmpFolder,
  uploadsFolder: path.resolve(tmpFolder, 'uploads'),

  multer: {
    storage: multer.diskStorage({
      destination: tmpFolder,
      filename: (_request, file, callback) => {
        const fileHash = crypto.randomBytes(10).toString('hex');
        callback(null, `${fileHash}-${file.originalname}`);
      },
    }),
  },
};
