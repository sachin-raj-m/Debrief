import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamRegistration from '@/components/game/TeamRegistration'
import Dashboard from '@/components/game/Dashboard'

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = await params
    const supabase = await createServerClient()

    // 1. Fetch Game by CODE (Short ID)
    const { data: game, error: gameError } = await supabase
        .from('sim_games')
        .select('*')
        .eq('code', gameId.toUpperCase()) // Case insensitive lookup
        .single()

    if (gameError || !game) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground relative">
                <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />
                <div className="text-center">
                    <h1 className="text-4xl font-heading font-bold mb-4">Game Not Found</h1>
                    <p className="text-muted-foreground">The game ID you entered does not exist.</p>
                </div>
            </div>
        )
    }

    // 2. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login?next=/game/' + gameId)
    }

    // 3. Check if user is in a team
    const { data: userTeam } = await supabase
        .from('sim_teams')
        .select('*')
        .eq('game_id', game.id)
        .contains('members', [user.id])
        .single()

    // 4. Render
    if (userTeam) {
        // User is already in a team -> Show Dashboard
        return <Dashboard game={game} team={userTeam} currentUser={user.id} />
    }

    // Check if user is the Admin/Creator (Facilitator Mode)
    if (game.created_by === user.id) {
        return <Dashboard game={game} currentUser={user.id} />
    }

    // User needs to join/create a team
    return <TeamRegistration gameId={game.id} userId={user.id} />
}
