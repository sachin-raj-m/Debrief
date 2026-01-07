export type GameStatus = 'waiting' | 'active' | 'completed';

export interface SimGame {
  id: string;
  created_at: string;
  status: GameStatus;
  current_round: number;
  total_rounds: number;
  budget_pool: number;
  created_by: string;
  code: string;
  round_ends_at?: string; // ISO timestamp for when current round ends
}

export interface SimTeam {
  id: string;
  game_id: string;
  name: string;
  members: string[]; // User IDs
  total_spent: number;
  total_downloads: number;
  created_at: string;
}

export interface SimDecision {
  id: string;
  game_id: string;
  team_id: string;
  round_number: number;
  decisions: Record<string, number>; // Channel ID -> Amount Spent
  submitted_at: string;
}

export interface SimResult {
  id: string;
  game_id: string;
  team_id: string;
  round_number: number;
  downloads_earned: number;
  efficiency_score: number;
  round_spending: number;
  event_log: string[];
  created_at: string;
}

export interface ChannelConfig {
  id: string;
  name: string;
  cost_per_1k: number; // Cost for 1000 downloads (base)
  max_spend_per_round: number;
  description: string;
  efficiency_trend: 'stable' | 'decreasing' | 'increasing' | 'volatile';
  special_effect?: string;
}
