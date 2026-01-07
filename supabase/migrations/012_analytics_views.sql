-- Analytics Views for Admin Dashboard
-- Precomputed aggregations to simplify frontend data fetching

-- 1. Daily Signups (User Growth)
CREATE OR REPLACE VIEW analytics_users_daily AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as count
FROM public.profiles
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 2. User Activity Stats (Approximate based on updated_at)
CREATE OR REPLACE VIEW analytics_active_users AS
SELECT
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as active_7d,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '30 days') as active_30d
FROM public.profiles;

-- 3. Idea Statisics Summary
CREATE OR REPLACE VIEW analytics_ideas_summary AS
SELECT
  COUNT(*) as total_ideas,
  COALESCE(AVG(upvotes_count), 0) as avg_upvotes,
  COALESCE(AVG(downvotes_count), 0) as avg_downvotes,
  COALESCE(AVG(comments_count), 0) as avg_comments
FROM public.ideas;

-- 4. Ideas Distribution by Level and Status
CREATE OR REPLACE VIEW analytics_ideas_by_level AS
SELECT
  level_number,
  status,
  COUNT(*) as count
FROM public.idea_levels
GROUP BY level_number, status
ORDER BY level_number, status;

-- 5. Game Session Statistics
CREATE OR REPLACE VIEW analytics_games_summary AS
SELECT
  COUNT(*) as total_games,
  COUNT(*) FILTER (WHERE status = 'waiting') as status_waiting,
  COUNT(*) FILTER (WHERE status = 'active') as status_active,
  COUNT(*) FILTER (WHERE status = 'completed') as status_completed,
  COALESCE(SUM(total_downloads), 0) as total_downloads_all_time
FROM (
  SELECT g.id, g.status, SUM(t.total_downloads) as total_downloads
  FROM public.sim_games g
  LEFT JOIN public.sim_teams t ON g.id = t.game_id
  GROUP BY g.id, g.status
) game_stats;

-- 6. Game Efficiency Metrics (from Results)
CREATE OR REPLACE VIEW analytics_game_efficiency AS
SELECT
  COALESCE(AVG(efficiency_score), 0) as avg_efficiency
FROM public.sim_results;

-- 7. Channel Decisions Analysis (Aggregate from JSONB)
-- Note: This is expensive query, optimized by being a view but still processes JSONB
CREATE OR REPLACE VIEW analytics_channel_popularity AS
WITH channels AS (
  SELECT key as channel_name
  FROM public.sim_decisions, jsonb_each(decisions)
)
SELECT channel_name, COUNT(*) as usage_count
FROM channels
GROUP BY channel_name
ORDER BY usage_count DESC;

-- Grant access to authenticated users (admin check happens at API level, but views need to be accessible)
GRANT SELECT ON analytics_users_daily TO authenticated;
GRANT SELECT ON analytics_active_users TO authenticated;
GRANT SELECT ON analytics_ideas_summary TO authenticated;
GRANT SELECT ON analytics_ideas_by_level TO authenticated;
GRANT SELECT ON analytics_games_summary TO authenticated;
GRANT SELECT ON analytics_game_efficiency TO authenticated;
GRANT SELECT ON analytics_channel_popularity TO authenticated;
