import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/simulation-game/constants';

// Force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // 1. Auth Check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch Data in Parallel
    const [
      { count: totalUsers },
      { data: dailyGrowth },
      { data: activeStats }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('analytics_users_daily').select('*').limit(30), // Last 30 days
      supabase.from('analytics_active_users').select('*').single()
    ]);

    return NextResponse.json({
      totalUsers,
      dailyGrowth: dailyGrowth || [],
      activeStats: activeStats || { active_7d: 0, active_30d: 0 }
    });

  } catch (error) {
    console.error('User Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
