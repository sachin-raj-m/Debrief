'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateRoundResults } from '@/lib/simulation-game/engine'
import { TOTAL_BUDGET_POOL, ADMIN_EMAILS, ROUND_DURATION_MS } from '@/lib/simulation-game/constants'
import { SimDecision, SimTeam } from '@/types/simulation'

export async function createGame() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) throw new Error("Unauthorized")

    if (!ADMIN_EMAILS.includes(user.email)) {
        throw new Error("Only admins can start a new game simulation.")
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data, error } = await supabase
        .from('sim_games')
        .insert({
            status: 'waiting',
            current_round: 0,
            budget_pool: TOTAL_BUDGET_POOL,
            code: code,
            created_by: user.id
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function startGame(gameId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) throw new Error("Unauthorized")
    if (!ADMIN_EMAILS.includes(user.email)) throw new Error("Only admins can start")

    const roundEndsAt = new Date(Date.now() + ROUND_DURATION_MS).toISOString()

    const { error } = await supabase
        .from('sim_games')
        .update({
            status: 'active',
            round_ends_at: roundEndsAt
        })
        .eq('id', gameId)

    if (error) throw new Error(error.message)

    // Revalidate both code and UUID paths
    const { data: gameData } = await supabase.from('sim_games').select('code').eq('id', gameId).single();
    if (gameData?.code) {
        revalidatePath(`/game/${gameData.code}`)
    }
    revalidatePath(`/game/${gameId}`)
}

export async function createTeam(gameId: string, teamName: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Helper function to revalidate paths
    const revalidateGamePaths = async () => {
        const { data: gameData } = await supabase.from('sim_games').select('code').eq('id', gameId).single();
        if (gameData?.code) {
            revalidatePath(`/game/${gameData.code}`)
        }
        revalidatePath(`/game/${gameId}`) // Fallback for UUID-based access
    }

    // Check if user is already in a team for this game
    const { data: existingTeam } = await supabase
        .from('sim_teams')
        .select('*')
        .eq('game_id', gameId)
        .contains('members', [user.id])
        .single()

    if (existingTeam) {
        // User already in a team, revalidate and return
        await revalidateGamePaths()
        return existingTeam
    }

    const { data, error } = await supabase
        .from('sim_teams')
        .insert({
            game_id: gameId,
            name: teamName,
            members: [user.id]
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Check team count for auto-start
    const { count } = await supabase
        .from('sim_teams')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId)

    if (count && count >= 5) {
        await supabase
            .from('sim_games')
            .update({ status: 'active' })
            .eq('id', gameId)
    }

    // Revalidate paths for cache freshness
    await revalidateGamePaths()
    return data
}

export async function submitDecision(gameId: string, teamId: string, roundNumber: number, decisions: Record<string, number>) {
    const supabase = await createServerClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify user is a member of this team
    const { data: team } = await supabase
        .from('sim_teams')
        .select('members')
        .eq('id', teamId)
        .single()

    if (!team || !(team.members as string[]).includes(user.id)) {
        throw new Error('You are not a member of this team')
    }

    // Validation: Check if round is correct
    const { data: game } = await supabase.from('sim_games').select('current_round').eq('id', gameId).single()
    if (!game || game.current_round !== roundNumber) {
        throw new Error("Invalid round number")
    }

    const { error } = await supabase
        .from('sim_decisions')
        .upsert({
            game_id: gameId,
            team_id: teamId,
            round_number: roundNumber,
            decisions
        }, { onConflict: 'team_id, round_number' })

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function processRound(gameId: string) {
    const supabase = await createServerClient()

    // 1. Fetch Game State
    const { data: game } = await supabase.from('sim_games').select('*').eq('id', gameId).single()
    if (!game) throw new Error("Game not found")

    const currentRound = game.current_round
    if (currentRound >= 6) throw new Error("Game over")

    // 2. Fetch all decisions for this round
    const { data: decisionsData } = await supabase
        .from('sim_decisions')
        .select('*')
        .eq('game_id', gameId)
        .eq('round_number', currentRound)

    // 3. Fetch all teams
    const { data: teamsData } = await supabase
        .from('sim_teams')
        .select('*')
        .eq('game_id', gameId)

    if (!decisionsData || !teamsData) {
        throw new Error("No data to process")
    }

    // Cast types
    const decisions = decisionsData as SimDecision[]
    const teams = teamsData as SimTeam[]

    // Handle teams that didn't submit - give them empty decisions (0 spend)
    const submittedTeamIds = new Set(decisions.map(d => d.team_id))
    teams.forEach(team => {
        if (!submittedTeamIds.has(team.id)) {
            // Team didn't submit - add empty decision
            decisions.push({
                id: crypto.randomUUID(),
                game_id: gameId,
                team_id: team.id,
                round_number: currentRound,
                decisions: {} // Empty = 0 spend on all channels
            } as SimDecision)
        }
    })

    // 4. Run Engines
    const results = calculateRoundResults(decisions, teams, currentRound)

    // 5. Save Results & Update Teams
    // We need to update budget pool and team totals
    let totalRoundSpendLocal = 0;

    for (const result of results) {
        // Save result
        await supabase.from('sim_results').insert({
            game_id: gameId,
            team_id: result.team_id,
            round_number: currentRound,
            downloads_earned: result.downloads_earned,
            efficiency_score: result.efficiency_score,
            round_spending: result.round_spending,
            event_log: result.event_log
        })

        // Update Team Totals
        const team = teams.find(t => t.id === result.team_id)
        if (team) {
            await supabase.from('sim_teams').update({
                total_spent: Number(team.total_spent) + result.round_spending,
                total_downloads: Number(team.total_downloads) + result.downloads_earned
            }).eq('id', result.team_id)
        }

        totalRoundSpendLocal += result.round_spending
    }

    // 6. Update Game State (Next Round, Reduce Budget)
    const newBudget = Number(game.budget_pool) - totalRoundSpendLocal
    const nextRound = currentRound + 1

    // Game ends if: we've completed all rounds OR budget is depleted
    const isGameOver = nextRound >= 6 || newBudget <= 0

    const roundEndsAt = new Date(Date.now() + ROUND_DURATION_MS).toISOString()

    await supabase.from('sim_games').update({
        current_round: nextRound,
        budget_pool: Math.max(0, newBudget), // Don't go negative
        status: isGameOver ? 'completed' : 'active',
        round_ends_at: isGameOver ? null : roundEndsAt
    }).eq('id', gameId)

    revalidatePath(`/game/${gameId}`)

    // Also revalidate code-based path
    const { data: gameData } = await supabase.from('sim_games').select('code').eq('id', gameId).single();
    if (gameData?.code) {
        revalidatePath(`/game/${gameData.code}`)
    }

    return { success: true, results }
}
