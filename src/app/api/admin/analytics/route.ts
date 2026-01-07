/**
 * Admin Analytics API
 * 
 * Aggregated endpoint returning all dashboard metrics.
 * Protected by admin-only access.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/admin";

export async function GET(request: Request) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Date range filter
    const range = searchParams.get("range") || "30d";
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch all metrics in parallel
    const [
      userStats,
      ideaStats,
      gameStats,
      recentSignups,
      recentIdeas,
    ] = await Promise.all([
      // User statistics
      getUserStats(supabase, startDate),
      // Idea statistics
      getIdeaStats(supabase, startDate),
      // Game statistics
      getGameStats(supabase),
      // Recent signups timeline
      getRecentSignups(supabase, startDate),
      // Recent ideas timeline
      getRecentIdeas(supabase, startDate),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: userStats,
        ideas: ideaStats,
        games: gameStats,
        timelines: {
          signups: recentSignups,
          ideas: recentIdeas,
        },
        range,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unauthorized") ? 401 : 
                   message.includes("Forbidden") ? 403 : 500;
    
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserStats(supabase: any, startDate: Date) {
  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // New users in range
  const { count: newUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString());

  // Active users (updated in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("updated_at", sevenDaysAgo.toISOString());

  return {
    total: totalUsers || 0,
    new: newUsers || 0,
    active: activeUsers || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getIdeaStats(supabase: any, startDate: Date) {
  // Total ideas
  const { count: totalIdeas } = await supabase
    .from("ideas")
    .select("*", { count: "exact", head: true });

  // New ideas in range
  const { count: newIdeas } = await supabase
    .from("ideas")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString());

  // Vote statistics
  const { data: voteData } = await supabase
    .from("ideas")
    .select("upvotes_count, downvotes_count");

  let totalUpvotes = 0;
  let totalDownvotes = 0;
  if (voteData) {
    for (const idea of voteData) {
      totalUpvotes += idea.upvotes_count || 0;
      totalDownvotes += idea.downvotes_count || 0;
    }
  }

  // Comments count
  const { count: totalComments } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true });

  // Feedback count
  const { count: totalFeedback } = await supabase
    .from("idea_feedback")
    .select("*", { count: "exact", head: true });

  // Backers count
  const { count: totalBackers } = await supabase
    .from("idea_backers")
    .select("*", { count: "exact", head: true });

  // Ideas by level
  const { data: levelData } = await supabase
    .from("ideas")
    .select("current_level");

  const byLevel: Record<number, number> = {};
  if (levelData) {
    for (const idea of levelData) {
      const level = idea.current_level || 1;
      byLevel[level] = (byLevel[level] || 0) + 1;
    }
  }

  // Top voted ideas
  const { data: topIdeas } = await supabase
    .from("ideas")
    .select("id, title, upvotes_count, downvotes_count")
    .order("upvotes_count", { ascending: false })
    .limit(5);

  return {
    total: totalIdeas || 0,
    new: newIdeas || 0,
    totalUpvotes,
    totalDownvotes,
    totalComments: totalComments || 0,
    totalFeedback: totalFeedback || 0,
    totalBackers: totalBackers || 0,
    byLevel,
    topVoted: topIdeas || [],
    avgVotesPerIdea: totalIdeas ? ((totalUpvotes + totalDownvotes) / totalIdeas).toFixed(2) : "0",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getGameStats(supabase: any) {
  // Total games
  const { count: totalGames } = await supabase
    .from("sim_games")
    .select("*", { count: "exact", head: true });

  // Games by status
  const { data: statusData } = await supabase
    .from("sim_games")
    .select("status");

  const byStatus: Record<string, number> = { waiting: 0, active: 0, completed: 0 };
  if (statusData) {
    for (const game of statusData) {
      byStatus[game.status] = (byStatus[game.status] || 0) + 1;
    }
  }

  // Total teams
  const { count: totalTeams } = await supabase
    .from("sim_teams")
    .select("*", { count: "exact", head: true });

  // Total downloads across all teams
  const { data: teamData } = await supabase
    .from("sim_teams")
    .select("total_downloads, total_spent");

  let totalDownloads = 0;
  let totalSpent = 0;
  if (teamData) {
    for (const team of teamData) {
      totalDownloads += Number(team.total_downloads) || 0;
      totalSpent += Number(team.total_spent) || 0;
    }
  }

  // Average efficiency from results
  const { data: efficiencyData } = await supabase
    .from("sim_results")
    .select("efficiency_score");

  let avgEfficiency = 0;
  if (efficiencyData && efficiencyData.length > 0) {
    const total = efficiencyData.reduce((sum: number, r: { efficiency_score: number }) => sum + (r.efficiency_score || 0), 0);
    avgEfficiency = total / efficiencyData.length;
  }

  // Channel popularity from decisions
  const { data: decisionData } = await supabase
    .from("sim_decisions")
    .select("decisions");

  const channelSpend: Record<string, number> = {};
  if (decisionData) {
    for (const d of decisionData) {
      const decisions = d.decisions as Record<string, number>;
      for (const [channel, amount] of Object.entries(decisions)) {
        channelSpend[channel] = (channelSpend[channel] || 0) + Number(amount);
      }
    }
  }

  // Archived games count
  const { count: archivedGames } = await supabase
    .from("game_sessions_archive")
    .select("*", { count: "exact", head: true });

  return {
    total: totalGames || 0,
    byStatus,
    totalTeams: totalTeams || 0,
    avgTeamsPerGame: totalGames ? (totalTeams! / totalGames).toFixed(2) : "0",
    totalDownloads,
    totalSpent,
    avgEfficiency: avgEfficiency.toFixed(2),
    channelPopularity: channelSpend,
    archivedGames: archivedGames || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecentSignups(supabase: any, startDate: Date) {
  const { data } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const byDate: Record<string, number> = {};
  if (data) {
    for (const profile of data) {
      const date = new Date(profile.created_at).toISOString().split("T")[0];
      byDate[date] = (byDate[date] || 0) + 1;
    }
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecentIdeas(supabase: any, startDate: Date) {
  const { data } = await supabase
    .from("ideas")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const byDate: Record<string, number> = {};
  if (data) {
    for (const idea of data) {
      const date = new Date(idea.created_at).toISOString().split("T")[0];
      byDate[date] = (byDate[date] || 0) + 1;
    }
  }

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}
