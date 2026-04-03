import { Router } from 'express';
import multer from 'multer';
import { env } from '../../env';
import { sessionAuth } from '../../middlewares/session-auth.middleware';
import { uploadController } from './controller';
import { validate } from '../../middlewares/validate.middleware';
import { getUploadSchema } from './validator';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024
  }
});

export const uploadRouter = Router();
uploadRouter.post('/', sessionAuth, upload.single('file'), uploadController.create);
uploadRouter.get('/:id/download', sessionAuth, validate(getUploadSchema), uploadController.download);
