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
      { data: levelsDistribution },
      { data: topIdeas }
    ] = await Promise.all([
      supabase.from('analytics_ideas_summary').select('*').single(),
      supabase.from('analytics_ideas_by_level').select('*'),
      supabase.from('ideas')
        .select('id, title, upvotes_count, downvotes_count, current_level')
        .order('upvotes_count', { ascending: false })
        .limit(10)
    ]);

    return NextResponse.json({
      summary: summary || {},
      levelsDistribution: levelsDistribution || [],
      topIdeas: topIdeas || []
    });

  } catch (error) {
    console.error('Idea Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
