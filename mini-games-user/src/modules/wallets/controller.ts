import { Request, Response } from 'express';
import { ok } from '../../utils/api-response';
import { walletService } from './service';

export class WalletController {
  async getWallet(req: Request, res: Response) {
    const wallet = await walletService.getWallet(req.user!.id);
    res.json(ok('Wallet summary', wallet));
  }

  async listTransactions(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;
    const data = await walletService.listTransactions(req.user!.id, limit, offset);
    res.json(ok('Wallet transactions', data, { page, limit }));
  }
}

export const walletController = new WalletController();
