import { Request, Response } from 'express';
import { created } from '../../lib/response';
import { uploadService } from './service';

export const uploadController = {
  async create(req: Request, res: Response) {
    if (!req.file) {
      res.status(422).json({ success: false, code: 'VALIDATION_ERROR', message: 'file is required' });
      return;
    }

    const companyId = req.auth!.role === 'SUPER_ADMIN'
      ? (typeof req.body.companyId === 'string' ? req.body.companyId : req.auth!.companyId)
      : req.auth!.companyId;

    const data = await uploadService.save(companyId, req.file);
    created(res, data);
  },

  async download(req: Request, res: Response) {
    const requestedCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : req.auth!.companyId;
    const companyId = req.auth!.role === 'SUPER_ADMIN' ? requestedCompanyId : req.auth!.companyId;
    const file = await uploadService.getById(companyId, req.params.id);

    res.setHeader('content-type', file.mimeType);
    res.setHeader('content-disposition', `inline; filename="${file.originalName}"`);
    res.sendFile(file.storagePath);
  }
};
