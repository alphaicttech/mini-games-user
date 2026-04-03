import { Request, Response } from 'express';
import { created, ok } from '../../lib/response';
import { ForbiddenError } from '../../lib/errors';
import { parsePagination } from '../../lib/pagination';
import { withdrawalService } from './service';

const APPROVER_ROLES = new Set(['SUPER_ADMIN', 'COMPANY_OWNER', 'COMPANY_ADMIN', 'COMPANY_FINANCE']);

function resolveCompanyId(req: Request, fallbackCompanyId: string): string {
  if (req.auth?.role === 'SUPER_ADMIN') {
    return fallbackCompanyId;
  }
  return req.auth!.companyId;
}

export const withdrawalController = {
  async list(req: Request, res: Response) {
    const pagination = parsePagination({ page: req.query.page, pageSize: req.query.pageSize });
    const requestedCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : req.auth!.companyId;
    const companyId = resolveCompanyId(req, requestedCompanyId);
    const status = typeof req.query.status === 'string' ? (req.query.status as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED') : undefined;

    const data = await withdrawalService.list(companyId, { ...pagination, status });
    ok(res, data);
  },

  async getById(req: Request, res: Response) {
    const requestedCompanyId = typeof req.query.companyId === 'string' ? req.query.companyId : req.auth!.companyId;
    const companyId = resolveCompanyId(req, requestedCompanyId);
    ok(res, await withdrawalService.byId(companyId, req.params.id));
  },

  async create(req: Request, res: Response) {
    const data = await withdrawalService.create({
      companyId: req.auth!.companyId,
      externalReference: req.body.externalReference,
      amount: req.body.amount,
      currency: req.body.currency,
      metadata: req.body.metadata,
      requestedByUserId: req.auth!.userId
    });
    created(res, data);
  },

  async approve(req: Request, res: Response) {
    if (!APPROVER_ROLES.has(req.auth!.role)) {
      throw new ForbiddenError('Approval access required');
    }

    const companyId = resolveCompanyId(req, req.body.companyId || req.auth!.companyId);
    const data = await withdrawalService.approve({
      companyId,
      withdrawalId: req.params.id,
      proofUploadedFileId: req.body.proofUploadedFileId,
      adminNote: req.body.adminNote,
      approvedByUserId: req.auth!.userId
    });
    ok(res, data);
  },

  async reject(req: Request, res: Response) {
    if (!APPROVER_ROLES.has(req.auth!.role)) {
      throw new ForbiddenError('Approval access required');
    }

    const companyId = resolveCompanyId(req, req.body.companyId || req.auth!.companyId);
    const data = await withdrawalService.reject({
      companyId,
      withdrawalId: req.params.id,
      reason: req.body.reason,
      rejectedByUserId: req.auth!.userId
    });
    ok(res, data);
  }
};
