import { SimDecision, SimResult, SimTeam } from "@/types/simulation";
import { CHANNELS } from "./constants";

export function calculateRoundResults(
    decisions: SimDecision[],
    teams: SimTeam[],
    roundNumber: number
): SimResult[] {
    // 1. Calculate Global Saturation per Channel
    const channelTotalSpend: Record<string, number> = {};

    decisions.forEach((d) => {
        Object.entries(d.decisions).forEach(([channelId, amount]) => {
            channelTotalSpend[channelId] = (channelTotalSpend[channelId] || 0) + amount;
        });
    });

    // 2. Process each team
    return decisions.map((decision) => {
        const team = teams.find(t => t.id === decision.team_id);
        if (!team) throw new Error("Team not found");

        let totalDownloads = 0;
        let totalSpend = 0;
        const eventLog: string[] = [];

        Object.entries(decision.decisions).forEach(([channelId, amount]) => {
            if (amount <= 0) return;
            totalSpend += amount;

            const channel = CHANNELS.find(c => c.id === channelId);
            if (!channel) return;

            // Base Calculation
            let efficiency = 1.0;

            // a. Game Phase Modifiers
            if (channel.efficiency_trend === 'decreasing') {
                // e.g. Social: drops 10% per round
                efficiency *= Math.max(0.5, 1 - (roundNumber - 1) * 0.1);
            } else if (channel.efficiency_trend === 'increasing') {
                // e.g. Content: gains 15% per round
                efficiency *= (1 + (roundNumber - 1) * 0.15);
            } else if (channel.efficiency_trend === 'volatile') {
                // Random variance: ±30% efficiency swing each round
                const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
                efficiency *= variance;
                if (variance < 1) {
                    eventLog.push(`${channel.name}: Bad luck this round (-${Math.round((1 - variance) * 100)}%)`);
                } else {
                    eventLog.push(`${channel.name}: Great performance (+${Math.round((variance - 1) * 100)}%)`);
                }
            }

            // b. Competition Penalty (if > 3 teams bid heavily)
            // Assumption: "Heavy" is > 30% of max spend
            // If global spend is high, everyone suffers
            // Simplification: If global spend > 50L (arbitrary), reduce 10%
            if (channelTotalSpend[channelId] > 5000000) {
                efficiency *= 0.9;
                if (!eventLog.includes(`Competition High on ${channel.name}`)) {
                    eventLog.push(`Competition High on ${channel.name} (-10%)`);
                }
            }

            // c. Influencer Momentum Bonus
            if (channel.id === 'influencers' && roundNumber > 1) {
                // Get a 10% bonus in later rounds due to brand momentum
                const momentumBonus = 1 + (roundNumber - 1) * 0.1;
                efficiency *= momentumBonus;
                eventLog.push(`Influencer momentum: +${Math.round((momentumBonus - 1) * 100)}%`);
            }

            // Calculate Downloads
            const rawDownloads = (amount / channel.cost_per_1k) * 1000;
            const finalDownloads = Math.floor(rawDownloads * efficiency);

            totalDownloads += finalDownloads;
        });

        // Efficiency Score: Downloads per 1 Lakh (100,000)
        const efficiencyScore = totalSpend > 0
            ? (totalDownloads / (totalSpend / 100000))
            : 0;

        return {
            id: crypto.randomUUID(),
            game_id: decision.game_id,
            team_id: decision.team_id,
            round_number: roundNumber,
            downloads_earned: totalDownloads,
            round_spending: totalSpend,
            efficiency_score: parseFloat(efficiencyScore.toFixed(2)),
            event_log: eventLog,
            created_at: new Date().toISOString()
        };
    });
}
