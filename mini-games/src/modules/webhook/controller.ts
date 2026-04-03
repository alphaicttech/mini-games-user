import { Request, Response } from 'express';
import { webhookService } from './service';
import { ok } from '../../lib/response';
import { AppError, ForbiddenError } from '../../lib/errors';
import { parsePagination } from '../../lib/pagination';

function resolveCompanyId(req: Request): string {
  const queryCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
  if (queryCompanyId) {
    if (req.auth?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Only super admins can query another company');
    }
    return queryCompanyId;
  }

  if (!req.auth?.companyId) {
    throw new AppError(422, 'VALIDATION_ERROR', 'companyId is required');
  }

  return req.auth.companyId;
}

export const webhookController = {
  async list(req: Request, res: Response) {
    const companyId = resolveCompanyId(req);
    const pagination = parsePagination({ page: req.query.page, pageSize: req.query.pageSize });
    const data = await webhookService.list(companyId, pagination);
    ok(res, data);
  },

  async logs(req: Request, res: Response) {
    return webhookController.list(req, res);
  },

  async getById(req: Request, res: Response) {
    ok(res, await webhookService.byId(resolveCompanyId(req), req.params.id));
  },

  async deliveries(req: Request, res: Response) {
    ok(res, await webhookService.deliveries(resolveCompanyId(req), req.params.id));
  },

  async resend(req: Request, res: Response) {
    const { companyId, depositSessionId, eventType } = req.body;
    const event = await webhookService.enqueueDepositEvent({ companyId, depositSessionId, eventType, payload: req.body.payload || {} });
    ok(res, event);
  }
};
