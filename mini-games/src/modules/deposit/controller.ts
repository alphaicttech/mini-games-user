import { Request, Response } from 'express';
import { created, ok } from '../../lib/response';
import { depositService } from './service';
import { parsePagination } from '../../lib/pagination';

export const depositController = {
  async list(req: Request, res: Response) {
    const pagination = parsePagination({ page: req.query.page, pageSize: req.query.pageSize });
    const data = await depositService.list(req.auth!.companyId, {
      ...pagination,
      status: typeof req.query.status === 'string' ? req.query.status : undefined
    });
    ok(res, data);
  },

  async getById(req: Request, res: Response) {
    const data = await depositService.byId(req.auth!.companyId, req.params.id);
    ok(res, data);
  },

  async create(req: Request, res: Response) {
    const data = await depositService.create(req.body);
    created(res, data);
  },

  async submit(req: Request, res: Response) {
    const result = await depositService.submit(req.params.id, req.body.txId);
    ok(res, result);
  }
};
