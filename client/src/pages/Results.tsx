import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Home, Trophy, Skull } from "lucide-react";
import { useMemo } from "react";

export default function Results() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const numericGameId = useMemo(() => Number(gameId), [gameId]);

  if (!Number.isFinite(numericGameId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <h1 className="text-2xl font-bold mb-2">Invalid Game ID</h1>
        <Button onClick={() => navigate("/")} variant="default">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  const { data, isLoading } = trpc.game.state.useQuery({ gameId: numericGameId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>Loading results...</p>
      </div>
    );
  }

  const result = data?.game?.result;
  const winner = result === "vampire_wins" ? "vampire" : "highschool";
  const players = data?.players ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Game Over</h1>
          {result === "vampire_wins" ? (
            <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
              <Skull className="w-8 h-8" />
              <p className="text-2xl font-bold">Vampire Wins!</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
              <Trophy className="w-8 h-8" />
              <p className="text-2xl font-bold">The High School Wins!</p>
            </div>
          )}
        </div>

        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>Final roles and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex justify-between items-center p-2 rounded border border-border">
                  <span className="font-medium">{player.displayName}</span>
                  <div className="flex gap-2">
                    <span className="text-sm text-muted-foreground">{player.role}</span>
                    {player.isAlive ? (
                      <span className="text-sm text-green-500">Alive</span>
                    ) : (
                      <span className="text-sm text-red-500">Eliminated</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/")} variant="default">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
