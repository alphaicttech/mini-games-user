import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { gameActions, gameSessions, games } from '../../db/schema/index';
import { walletService } from '../wallets/service';
import { miniGamesAdapter } from './adapters/mini-games.adapter';

export class GamesService {
  async syncGamesFromAdapter() {
    const items = await miniGamesAdapter.listGames();
    for (const item of items) {
      const existing = await db.query.games.findFirst({ where: eq(games.code, item.code) });
      if (!existing) {
        await db.insert(games).values({ code: item.code, name: item.name, slug: item.slug, description: item.description, config: item.config });
      }
    }
  }

  listActiveGames() {
    return db.query.games.findMany({ where: eq(games.is_active, true) });
  }

  getGameByCode(code: string) {
    return db.query.games.findFirst({ where: eq(games.code, code) });
  }

  async start(user_id: string, code: string, bet_amount: string) {
    return db.transaction(async (tx) => {
      const game = await tx.query.games.findFirst({ where: and(eq(games.code, code), eq(games.is_active, true)) });
      if (!game) throw new Error('Game not found or disabled');

      await walletService.mutateBalance({
        user_id,
        amount: bet_amount,
        type: 'BET',
        direction: 'DEBIT',
        reference_type: 'game',
        reference_id: game.id,
        description: `Bet for game ${code}`
      });

      const started = await miniGamesAdapter.startSession({ game_code: code, user_id, bet_amount });
      const [session] = await tx
        .insert(gameSessions)
        .values({
          user_id,
          game_id: game.id,
          session_token: started.session_token,
          status: 'PLAYING',
          bet_amount,
          game_payload: started.payload
        })
        .returning();
      return session;
    });
  }

  async play(user_id: string, code: string, session_id: string, action: Record<string, unknown>) {
    return db.transaction(async (tx) => {
      const session = await tx.query.gameSessions.findFirst({ where: and(eq(gameSessions.id, session_id), eq(gameSessions.user_id, user_id)) });
      if (!session) throw new Error('Game session not found');

      const result = await miniGamesAdapter.play({ game_code: code, session_token: session.session_token, action });

      await tx.insert(gameActions).values({ game_session_id: session.id, action_type: 'PLAY', request_payload: action, response_payload: result.result_payload });

      if (result.status === 'WON' && result.win_amount !== '0.000000') {
        await walletService.mutateBalance({
          user_id,
          amount: result.win_amount,
          type: 'WIN',
          direction: 'CREDIT',
          reference_type: 'game_session',
          reference_id: session.id,
          description: `Winnings from ${code}`
        });
      }

      const [updated] = await tx
        .update(gameSessions)
        .set({
          status: result.status,
          win_amount: result.win_amount,
          result_payload: result.result_payload,
          ended_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(gameSessions.id, session.id))
        .returning();

      return updated;
    });
  }

  listSessions(user_id: string, limit = 20, offset = 0) {
    return db.query.gameSessions.findMany({ where: eq(gameSessions.user_id, user_id), orderBy: [desc(gameSessions.created_at)], limit, offset });
  }

  getSession(user_id: string, id: string) {
    return db.query.gameSessions.findFirst({ where: and(eq(gameSessions.user_id, user_id), eq(gameSessions.id, id)) });
  }
}

export const gamesService = new GamesService();
