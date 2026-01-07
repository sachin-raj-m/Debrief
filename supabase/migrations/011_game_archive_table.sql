-- Game Sessions Archive Table
-- Stores complete snapshots of completed games for analytics and historical reference

CREATE TABLE IF NOT EXISTS game_sessions_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES sim_games(id) ON DELETE SET NULL,
  snapshot_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  game_data JSONB NOT NULL,
  teams_data JSONB NOT NULL,
  results_data JSONB NOT NULL,
  decisions_data JSONB NOT NULL,
  archived_by UUID REFERENCES auth.users(id)
);

-- Index for quick lookups by game_id
CREATE INDEX IF NOT EXISTS idx_game_archive_game_id ON game_sessions_archive(game_id);
CREATE INDEX IF NOT EXISTS idx_game_archive_snapshot ON game_sessions_archive(snapshot_at DESC);

-- Enable RLS
ALTER TABLE game_sessions_archive ENABLE ROW LEVEL SECURITY;

-- Only admins can read archives (enforced at API level, but RLS as backup)
-- For now, allow authenticated users to view (admin check in API)
CREATE POLICY "Authenticated users can view game archives"
  ON game_sessions_archive FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert (enforced at API level)
CREATE POLICY "Authenticated users can archive games"
  ON game_sessions_archive FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to auto-archive completed games
CREATE OR REPLACE FUNCTION archive_completed_game()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO game_sessions_archive (game_id, game_data, teams_data, results_data, decisions_data)
    SELECT
      NEW.id,
      to_jsonb(NEW),
      COALESCE((SELECT jsonb_agg(t) FROM sim_teams t WHERE t.game_id = NEW.id), '[]'::jsonb),
      COALESCE((SELECT jsonb_agg(r) FROM sim_results r WHERE r.game_id = NEW.id), '[]'::jsonb),
      COALESCE((SELECT jsonb_agg(d) FROM sim_decisions d WHERE d.game_id = NEW.id), '[]'::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-archive when game completes
DROP TRIGGER IF EXISTS on_game_completed ON sim_games;
CREATE TRIGGER on_game_completed
  AFTER UPDATE ON sim_games
  FOR EACH ROW
  EXECUTE FUNCTION archive_completed_game();
