-- Add timer support for strict round limits
alter table sim_games add column round_ends_at timestamp with time zone;
