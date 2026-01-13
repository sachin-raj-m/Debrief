import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createServerClient();

    // Parallel fetch: Analytics + Game History
    const [
      { data: summary },
      { data: groupedSummary },
      { data: efficiency },
      { data: channelStats },
      { data: games }
    ] = await Promise.all([
      supabase.from('analytics_games_summary').select('*').single(),
      supabase.from('analytics_games_by_type').select('*'),
      supabase.from('analytics_game_efficiency').select('*').single(),
      supabase.from('analytics_channel_popularity').select('*').limit(10),
      supabase.from('sim_games').select('*, sim_teams(*)').order('created_at', { ascending: false }).limit(50)
    ]);

    // Enrich Games with User Profiles
    let enrichedGames = [];
    if (games && games.length > 0) {
      const userIds = new Set<string>();
      games.forEach(g => {
        g.sim_teams?.forEach((t: any) => {
          t.members?.forEach((uid: string) => userIds.add(uid));
        });
      });

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', Array.from(userIds));

        enrichedGames = games.map(g => ({
          ...g,
          sim_teams: g.sim_teams.map((t: any) => ({
            ...t,
            members_details: profiles?.filter(p => t.members?.includes(p.id)) || []
          }))
        }));
      } else {
        enrichedGames = games;
      }
    }

    return NextResponse.json({
      summary: summary || {},
      groupedSummary: groupedSummary || [],
      efficiency: efficiency?.avg_efficiency || 0,
      channelStats: channelStats || [],
      games: enrichedGames
    });

  } catch (error) {
    console.error('Game Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
