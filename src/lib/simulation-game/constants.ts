import { ChannelConfig } from "@/types/simulation";

export const ADMIN_EMAILS = ["sachin@mulearn.org", "admin@debrief.com"]; // Replace with actual admin emails
export const TOTAL_BUDGET_POOL = 15000000; // 1.5 Cr (Global Pool)
export const MAX_ROUNDS = 6;
export const ROUND_DURATION_MS = 150000; // 2.5 minutes
export const MAX_TEAM_TOTAL_BUDGET = 3000000; // 30L limit per team (Total across all rounds)

export const CHANNELS: ChannelConfig[] = [
    {
        id: "social_ads",
        name: "Social Ads (Instagram/TikTok)",
        cost_per_1k: 135000,
        max_spend_per_round: 3000000, // Capped at Team Total (30L)
        description: "Fast scale, fatigues after Round 3 (+20% cost).",
        efficiency_trend: "decreasing",
    },
    {
        id: "influencers",
        name: "Influencer Marketing",
        cost_per_1k: 180000,
        max_spend_per_round: 3000000, // Capped at Team Total (30L)
        description: "Steady, +10% bonus efficiency in next round.",
        efficiency_trend: "stable",
        special_effect: "momentum_bonus",
    },
    {
        id: "content_marketing",
        name: "Content Marketing (YouTube/SEO)",
        cost_per_1k: 225000,
        max_spend_per_round: 3000000, // Capped at Team Total (30L)
        description: "+5K organic lift in Rounds 4-6.",
        efficiency_trend: "increasing",
    },
    {
        id: "search_ads",
        name: "Paid Search (Google/Apple)",
        cost_per_1k: 162000,
        max_spend_per_round: 3000000, // Capped at Team Total (30L)
        description: "Costs rise 15% from Round 4 onwards.",
        efficiency_trend: "decreasing",
    },
    {
        id: "email",
        name: "Email Retargeting",
        cost_per_1k: 108000,
        max_spend_per_round: 1080000, // 10.8L (Below 30L, kept as is)
        description: "₹45K setup cost in Round 1. Strong later.",
        efficiency_trend: "increasing",
    },
    {
        id: "referral",
        name: "Referral Program",
        cost_per_1k: 90000,
        max_spend_per_round: 3000000, // Capped at Team Total (30L)
        description: "Viral: 10K downloads = +2K free in next round.",
        efficiency_trend: "volatile",
        special_effect: "saturation_risk",
    },
    {
        id: "pr",
        name: "PR Partnerships",
        cost_per_1k: 198000,
        max_spend_per_round: 2376000, // 23.76L (Below 30L, kept as is)
        description: "+20% effect from Round 3 onwards.",
        efficiency_trend: "volatile",
    }
];
