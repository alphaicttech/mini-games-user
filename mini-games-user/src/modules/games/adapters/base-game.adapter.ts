export interface BaseGameAdapter {
  listGames(): Promise<Array<{ code: string; name: string; slug: string; description?: string; config?: Record<string, unknown> }>>;
  startSession(input: { game_code: string; user_id: string; bet_amount: string }): Promise<{ session_token: string; payload?: Record<string, unknown> }>;
  play(input: { game_code: string; session_token: string; action: Record<string, unknown> }): Promise<{ success: boolean; status: 'WON' | 'LOST' | 'FAILED'; win_amount: string; result_payload: Record<string, unknown> }>;
}
