import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/simulation-game/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || !session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // 'users', 'ideas', 'games'

    let data;
    if (type === 'users') {
      const { data: res } = await supabase.from('profiles').select('id, email, full_name, created_at, updated_at');
      // Simple anonymization for export if needed, or keeping it raw for admins
      data = res;
    } else if (type === 'ideas') {
      const { data: res } = await supabase.from('ideas').select('*, idea_levels(level_number, status)');
      data = res;
    } else if (type === 'games') {
      const { data: res } = await supabase.from('game_sessions_archive').select('*');
      data = res;
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
