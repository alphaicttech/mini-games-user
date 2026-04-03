import { Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { depositsService } from './service';

export class DepositsController {
  async create(req: Request, res: Response) {
    const data = await depositsService.create(req.user!.id, req.body.amount, req.body.payment_reference);
    res.status(201).json(ok('Deposit request created', data));
  }

  async list(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const data = await depositsService.listByUser(req.user!.id, limit, (page - 1) * limit);
    res.json(ok('Deposits fetched', data, { page, limit }));
  }

  async detail(req: Request, res: Response) {
    const data = await depositsService.getById(req.user!.id, req.params.id);
    res.json(ok('Deposit detail', data));
  }

  async verify(req: Request, res: Response) {
    const data = await depositsService.verify(req.user!.id, req.params.id, req.body?.payload);
    res.json(ok('Deposit verification processed', data));
  }
}

export const depositsController = new DepositsController();
