import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/simulation-game/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || !session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      { data: summary },
      { data: efficiency },
      { data: channelStats }
    ] = await Promise.all([
      supabase.from('analytics_games_summary').select('*').single(),
      supabase.from('analytics_game_efficiency').select('*').single(),
      supabase.from('analytics_channel_popularity').select('*').limit(10)
    ]);

    return NextResponse.json({
      summary: summary || {},
      efficiency: efficiency?.avg_efficiency || 0,
      channelStats: channelStats || []
    });

  } catch (error) {
    console.error('Game Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
