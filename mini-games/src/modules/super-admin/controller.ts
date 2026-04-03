import { Request, Response } from 'express';
import { created } from '../../lib/response';
import { ForbiddenError } from '../../lib/errors';
import { depositService } from '../deposit/service';
import { walletService } from '../wallet/service';

export const superAdminController = {
  async createDepositForCompany(req: Request, res: Response) {
    if (req.auth?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Super admin access required');
    }

    const data = await depositService.createForCompanyId(req.body);
    created(res, data);
  },

  async creditCompanyBalance(req: Request, res: Response) {
    if (req.auth?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Super admin access required');
    }

    const data = await walletService.creditCompanyBalance({
      companyId: req.params.companyId,
      amount: req.body.amount,
      reason: req.body.reason,
      actorUserId: req.auth.userId
    });
    created(res, data);
  }
};
