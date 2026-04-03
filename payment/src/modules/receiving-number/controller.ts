import { Request, Response } from 'express';
import { created, ok } from '../../lib/response';
import { receivingNumberService } from './service';
import { parsePagination } from '../../lib/pagination';

export const receivingNumberController = {
  async list(req: Request, res: Response) {
    const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
    const pagination = parsePagination({ page: req.query.page, pageSize: req.query.pageSize });
    ok(res, await receivingNumberService.list({
      actorRole: req.auth!.role,
      actorCompanyId: req.auth!.companyId,
      companyId,
      ...pagination
    }));
  },
  async create(req: Request, res: Response) {
    const record = await receivingNumberService.create({
      actorRole: req.auth!.role,
      actorCompanyId: req.auth!.companyId,
      actorUserId: req.auth!.userId,
      ...req.body
    });
    created(res, record);
  },
  async activate(req: Request, res: Response) {
    await receivingNumberService.activate(req.auth!.companyId, req.params.id);
    ok(res, { activated: true });
  }
};
