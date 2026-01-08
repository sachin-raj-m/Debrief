-- Fix visibility for simulation games and teams
-- This allows players to join games using the code (lookup) and view the lobby

-- 1. Allow public read access to sim_games (needed for "Join by Code" lookup)
drop policy if exists "Anyone can view games" on sim_games;
create policy "Anyone can view games" on sim_games
  for select
  using ( true );

-- 2. Allow public read access to sim_teams (needed for Lobby/Waiting Room)
drop policy if exists "Anyone can view teams" on sim_teams;
create policy "Anyone can view teams" on sim_teams
  for select
  using ( true );
