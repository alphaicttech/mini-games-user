import { Request, Response } from 'express';
import { ok } from '../../lib/response';
import { companyService } from './service';
import { parsePagination } from '../../lib/pagination';

export const companyController = {
  async list(req: Request, res: Response) {
    const pagination = parsePagination({ page: req.query.page, pageSize: req.query.pageSize });
    ok(res, await companyService.list(pagination));
  },
  async getById(req: Request, res: Response) {
    ok(res, await companyService.byId(req.params.id));
  }
};
