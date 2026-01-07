-- Fix realtime visibility for simulation decisions
-- This is critical for the Facilitator view to update live
alter publication supabase_realtime add table sim_decisions;

-- Allow facilitators (game creators) to view decisions for their games
-- Previously, only team members could view their own decisions
create policy "Facilitators can view game decisions" on sim_decisions
  for select
  using (
    exists (
      select 1 from sim_games
      where sim_games.id = sim_decisions.game_id
      and sim_games.created_by = auth.uid()
    )
  );
