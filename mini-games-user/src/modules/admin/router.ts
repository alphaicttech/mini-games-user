import { Router } from 'express';
import { authAdmin, requirePermission } from '../../middlewares/auth-admin';
import { PERMISSIONS } from '../../constants/permissions';
import { ok } from '../../utils/api-response';
import { adminService } from './service';

const router = Router();
router.use(authAdmin);

router.get('/dashboard/summary', requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (_req, res) => res.json(ok('Dashboard summary', await adminService.dashboardSummary())));

router.get('/admins', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (_req, res) => res.json(ok('Admins', await adminService.listAdmins())));
router.post('/admins', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => res.status(201).json(ok('Admin created', await adminService.createAdmin(req.body))));
router.get('/admins/:id', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => res.json(ok('Admin detail', await adminService.getAdmin(req.params.id))));
router.patch('/admins/:id', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => res.json(ok('Admin updated', await adminService.updateAdmin(req.params.id, req.body))));
router.patch('/admins/:id/status', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => res.json(ok('Admin status updated', await adminService.updateAdmin(req.params.id, { status: req.body.status }))));
router.patch('/admins/:id/password', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res) => res.json(ok('Admin password updated', await adminService.updateAdminPassword(req.params.id, req.body.password))));

router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => res.json(ok('Users', await adminService.listUsers(String(req.query.search || '')))));
router.get('/users/:id', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => res.json(ok('User', await adminService.getUser(req.params.id))));
router.patch('/users/:id/status', requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => res.json(ok('User status updated', await adminService.updateUserStatus(req.params.id, req.body.status))));
router.patch('/users/:id/balance', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (req, res) =>
  res.json(ok('Balance adjusted', await adminService.adjustUserBalance({ user_id: req.params.id, amount: req.body.amount, direction: req.body.direction, admin_id: req.admin!.id, reason: req.body.reason })))
);

router.get('/users/:id/transactions', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (req, res) => res.json(ok('User transactions', await adminService.listTransactions())));
router.get('/users/:id/deposits', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (_req, res) => res.json(ok('User deposits', await adminService.listDeposits())));
router.get('/users/:id/game-sessions', requirePermission(PERMISSIONS.MANAGE_GAMES), async (_req, res) => res.json(ok('User game sessions', await adminService.listGameSessions())));

router.get('/deposits', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (_req, res) => res.json(ok('Deposits', await adminService.listDeposits())));
router.get('/deposits/:id', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (req, res) => res.json(ok('Deposit', await adminService.getDeposit(req.params.id))));
router.post('/deposits/:id/verify', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (req, res) => res.json(ok('Deposit verified', await adminService.verifyDeposit(req.params.id))));
router.post('/deposits/:id/retry', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (req, res) => res.json(ok('Deposit retry done', await adminService.verifyDeposit(req.params.id))));
router.patch('/deposits/:id/status', requirePermission(PERMISSIONS.MANAGE_DEPOSITS), async (_req, res) => res.json(ok('Use verify/retry flow for status transitions')));

router.get('/transactions', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (_req, res) => res.json(ok('Transactions', await adminService.listTransactions())));
router.get('/transactions/:id', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (req, res) => res.json(ok('Transaction', await adminService.getTransaction(req.params.id))));
router.post('/transactions/adjust', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (req, res) =>
  res.json(ok('Transaction adjustment completed', await adminService.adjustUserBalance({ ...req.body, admin_id: req.admin!.id })))
);
router.post('/transactions/refund', requirePermission(PERMISSIONS.MANAGE_TRANSACTIONS), async (req, res) => res.json(ok('Transaction refunded', await adminService.refundTransaction(req.body.transaction_id, req.admin!.id))));

router.get('/games', requirePermission(PERMISSIONS.MANAGE_GAMES), async (_req, res) => res.json(ok('Games', await adminService.listGames())));
router.post('/games', requirePermission(PERMISSIONS.MANAGE_GAMES), async (req, res) => res.status(201).json(ok('Game created', await adminService.createGame(req.body))));
router.get('/games/:id', requirePermission(PERMISSIONS.MANAGE_GAMES), async (req, res) => res.json(ok('Game', await adminService.getGame(req.params.id))));
router.patch('/games/:id', requirePermission(PERMISSIONS.MANAGE_GAMES), async (req, res) => res.json(ok('Game updated', await adminService.updateGame(req.params.id, req.body))));
router.patch('/games/:id/status', requirePermission(PERMISSIONS.MANAGE_GAMES), async (req, res) => res.json(ok('Game status updated', await adminService.updateGame(req.params.id, { is_active: req.body.is_active }))));
router.get('/game-sessions', requirePermission(PERMISSIONS.MANAGE_GAMES), async (_req, res) => res.json(ok('Game sessions', await adminService.listGameSessions())));
router.get('/game-sessions/:id', requirePermission(PERMISSIONS.MANAGE_GAMES), async (req, res) => res.json(ok('Game session', await adminService.getGameSession(req.params.id))));

router.get('/settings', requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (_req, res) => res.json(ok('Settings', await adminService.listSettings())));
router.patch('/settings/:key', requirePermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => res.json(ok('Setting updated', await adminService.updateSetting(req.params.key, req.body.value, req.admin!.id))));

router.get('/audit-logs', requirePermission(PERMISSIONS.VIEW_AUDIT), async (_req, res) => res.json(ok('Audit logs', await adminService.listAuditLogs())));

export default router;
