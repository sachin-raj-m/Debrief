"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAnalytics } from "../components/UserAnalytics";
import { IdeaAnalytics } from "../components/IdeaAnalytics";
import { GameAnalytics } from "../components/GameAnalytics";
import { ExportPanel } from "../components/ExportPanel";

export default function AdminAnalyticsPage() {
    return (
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Monitor platform growth, ideas, and simulation game metrics.</p>
                </div>
                <ExportPanel />
            </div>

            <Tabs defaultValue="users" className="space-y-8">
                <TabsList className="bg-white/5 border border-white/10 p-1 h-auto">
                    <TabsTrigger value="users" className="px-6 py-2.5 data-[state=active]:bg-white/10">Users & Growth</TabsTrigger>
                    <TabsTrigger value="ideas" className="px-6 py-2.5 data-[state=active]:bg-white/10">Idea Pipeline</TabsTrigger>
                    <TabsTrigger value="games" className="px-6 py-2.5 data-[state=active]:bg-white/10">Simulation Game</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6 outline-none">
                    <UserAnalytics />
                </TabsContent>

                <TabsContent value="ideas" className="space-y-6 outline-none">
                    <IdeaAnalytics />
                </TabsContent>

                <TabsContent value="games" className="space-y-6 outline-none">
                    <GameAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
