'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createGame } from '@/app/actions/game-actions'
import { toast } from 'sonner'
import { ShieldAlert, Rocket } from 'lucide-react'

export default function AdminGamePage() {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

    const handleCreateGame = async () => {
        try {
            setIsCreating(true)
            const newGame = await createGame()
            toast.success("Game Created!", { description: `Game Code: ${newGame.code}` })
            router.push(`/game/${newGame.code}`)
        } catch (error) {
            toast.error("Failed to create game", {
                description: error instanceof Error ? error.message : "Unknown error"
            })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans max-w-[1600px] mx-auto text-foreground relative">
            <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />

            <Card variant="glass" className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-heading text-foreground">Admin Console</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Create and manage Growth Strategy Lab simulations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleCreateGame}
                        disabled={isCreating}
                        variant="default"
                        className="w-full h-12 text-lg"
                    >
                        {isCreating ? 'Creating...' : (
                            <div className="flex items-center gap-2">
                                <Rocket className="w-4 h-4" /> Start New Simulation
                            </div>
                        )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Only authorized admin emails can perform this action.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
