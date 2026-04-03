export type GamePlayResult = {
  success: boolean;
  status: 'WON' | 'LOST' | 'FAILED';
  win_amount: string;
  result_payload: Record<string, unknown>;
};

export interface IGameEngineAdapter {
  listGames(): Promise<Array<{ code: string; name: string; slug: string; description?: string; config?: Record<string, unknown> }>>;
  startSession(input: { game_code: string; user_id: string; bet_amount: string }): Promise<{ session_token: string; payload?: Record<string, unknown> }>;
  play(input: { game_code: string; session_token: string; action: Record<string, unknown> }): Promise<GamePlayResult>;
}

export class MiniGamesEngineAdapter implements IGameEngineAdapter {
  async listGames() {
    // TODO: wire real adapter from ../mini-games sibling package.
    return [{ code: 'dice', name: 'Dice', slug: 'dice', description: 'Simple dice game', config: { min_bet: '1.000000' } }];
  }

  async startSession(input: { game_code: string; user_id: string; bet_amount: string }) {
    return { session_token: `${input.game_code}_${input.user_id}_${Date.now()}`, payload: { accepted_bet: input.bet_amount } };
  }

  async play() {
    const won = Math.random() > 0.5;
    return {
      success: true,
      status: won ? 'WON' : 'LOST',
      win_amount: won ? '2.000000' : '0.000000',
      result_payload: { random: Math.random() }
    };
  }
}
