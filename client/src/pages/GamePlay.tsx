import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import {
  Skull,
  Timer,
  Vote,
  Crown,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
  Home,
  ShieldAlert,
  Swords,
  Crosshair,
  Lock,
  UserX,
  BookOpen,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import {
  ROLE_ABILITIES,
  ROLE_PORTRAITS,
  NON_VOTING_ROLES,
  NON_INITIATING_ROLES,
  VOTING_DURATION_MS,
  ROLES,
  ROLE_TO_ABILITY,
  ABILITY_LIMITS,
  VAMPIRE_BLOCKED_ABILITIES,
} from "@shared/types";
import type { Role, AbilityName } from "@shared/types";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useAbilitySound } from "@/hooks/useAbilitySound";

// ─── Role Icons ─────────────────────────────────────────────────────
const ROLE_ICONS: Record<string, string> = {
  "Homecoming Queen": "👑",
  Bully: "👊",
  "Gossip Queen": "💬",
  Mathlete: "🧮",
  Teacher: "📚",
  "Dumb Cheerleader": "📣",
  "Dumb Jock": "🏈",
  Principal: "🎓",
  "School Counselor": "🧑‍⚕️",
  Vampire: "🧛",
};

const ABILITY_BUTTON_LABELS: Record<AbilityName, string> = {
  homecoming_fastforward: "Fast-Forward to Vote",
  bully_spotlight: "Spotlight a Player",
  gossip_queen_destroy: "Destroy Reputation",
  mathlete_view: "View Unused Roles",
  teacher_detain: "Detain a Player",
  cheerleader_peek: "Peek at a Role",
  dumb_jock_intimidate: "Intimidate a Player",
  school_counselor_pull: "Pull to Office",
  principal_administrative_leave: "Administrative Leave",
};

// ─── Timer Hook ─────────────────────────────────────────────────────
function useCountdown(targetMs: number | null) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetMs) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (!targetMs) return { minutes: 0, seconds: 0, total: 0, expired: true };
  const remaining = Math.max(0, targetMs - now);
  return {
    minutes: Math.floor(remaining / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
    total: remaining,
    expired: remaining <= 0,
  };
}

export default function GamePlay() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const numericGameId = useMemo(() => Number(gameId), [gameId]);
  const isValidGameId = Number.isFinite(numericGameId);

  // ALL hooks must be called unconditionally (React rules of hooks)
  const [showRole, setShowRole] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<AbilityName | null>(null);
  const [abilityTarget, setAbilityTarget] = useState<number | null>(null);
  const [showAbilityPicker, setShowAbilityPicker] = useState(false);
  const [abilityResult, setAbilityResult] = useState<any>(null);
  const [showAbilityResult, setShowAbilityResult] = useState(false);
  const [usedAbility, setUsedAbility] = useState<AbilityName | null>(null);
  const [showMathleteRoles, setShowMathleteRoles] = useState(false);
  const [mathleteTimer, setMathleteTimer] = useState(0);
  const [showRolesReference, setShowRolesReference] = useState(false);
  const [spotlightTarget, setSpotlightTarget] = useState<{ id: number; name: string; endsAt: number } | null>(null);
  const gameAudio = useGameAudio();
  const { playAbilitySound } = useAbilitySound();

  const { data, isLoading, refetch } = trpc.game.state.useQuery(
    { gameId: numericGameId || 0 },
    { refetchInterval: 1000, enabled: isValidGameId }
  );

  const useAbility = trpc.game.useAbility.useMutation();
  const castVote = trpc.game.vote.useMutation();

  const currentPlayer = data?.currentPlayer;
  const role = (currentPlayer?.role as Role) || null;
  const phase = data?.game?.phase;
  const round = data?.game?.round ?? 1;
  const alivePlayers = data?.players ?? [];
  const result = data?.game?.result;

  // Determine if the current player's ability is available
  const myAbility = role ? ROLE_TO_ABILITY[role] : null;
  const abilityUsages = data?.abilityUsed ?? [];

  // For Vampire: all abilities are available; for others: only their own
  const availableAbilities = useMemo(() => {
    if (role === "Vampire") {
      return (Object.keys(ABILITY_LIMITS) as AbilityName[]).filter(
        (a) => !VAMPIRE_BLOCKED_ABILITIES.includes(a)
      );
    }
    return myAbility ? [myAbility] : [];
  }, [role, myAbility]);

  const abilityAvailable = useMemo(() => {
    if (!selectedAbility || !currentPlayer?.isAlive) return false;
    if (phase !== "playing") return false;
    if (currentPlayer?.isDetained) return false;
    if (currentPlayer?.abilityBlockedUntil && Date.now() < currentPlayer.abilityBlockedUntil) return false;

    const limit = ABILITY_LIMITS[selectedAbility];
    if (limit === "once_per_game") {
      return !abilityUsages.some((u) => u.ability === selectedAbility);
    } else {
      return !abilityUsages.some(
        (u) => u.ability === selectedAbility && u.round === round
      );
    }
  }, [selectedAbility, abilityUsages, round, currentPlayer, phase]);

  // Mathlete 30-second timer
  useEffect(() => {
    if (!showMathleteRoles) return;
    setMathleteTimer(30);
    const interval = setInterval(() => {
      setMathleteTimer((prev) => {
        if (prev <= 1) {
          setShowMathleteRoles(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showMathleteRoles]);

  // Track active spotlight ability
  useEffect(() => {
    const spotlightUsage = abilityUsages.find((u: any) => u.ability === "bully_spotlight");
    if (spotlightUsage && spotlightUsage.result) {
      try {
        const result = JSON.parse(spotlightUsage.result);
        const now = Date.now();
        if (result.silenceEndsAt > now) {
          // Find the target player by name
          const targetPlayer = alivePlayers.find((p: any) => p.displayName === result.targetName);
          if (targetPlayer) {
            setSpotlightTarget({
              id: targetPlayer.id,
              name: result.targetName,
              endsAt: result.silenceEndsAt,
            });
          }
        } else {
          setSpotlightTarget(null);
        }
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      setSpotlightTarget(null);
    }
  }, [abilityUsages, alivePlayers]);

  // Update spotlight timer every second for smooth countdown
  useEffect(() => {
    if (!spotlightTarget) return;
    const interval = setInterval(() => {
      setSpotlightTarget((prev) => {
        if (!prev) return null;
        if (prev.endsAt <= Date.now()) {
          return null;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [spotlightTarget]);

  // Auto-refetch when phase changes
  useEffect(() => {
    const interval = setInterval(() => refetch(), 500);
    return () => clearInterval(interval);
  }, [refetch]);

  // Redirect on game end
  useEffect(() => {
    if (result) {
      navigate(`/results/${numericGameId}`);
    }
  }, [result, numericGameId, navigate]);

  // Timers - must be called unconditionally (React rules of hooks)
  const discussionTimer = useCountdown(data?.game?.timerEndsAt ?? null);
  const votingTimer = useCountdown(data?.game?.votingEndsAt ?? null);

  // Audio management based on game phase
  useEffect(() => {
    gameAudio.setPhase(phase);
  }, [phase, gameAudio.setPhase]);

  // Sound effects for key game events
  useEffect(() => {
    if (phase === "round_end" && data?.vampireKill) {
      gameAudio.playSfx("vampireKill");
    }
  }, [phase, data?.vampireKill, gameAudio.playSfx]);

  useEffect(() => {
    if (phase === "results" && result === "highschool_wins") {
      gameAudio.playSfx("vampireCaught");
    }
  }, [phase, result, gameAudio.playSfx]);
  const handleCastVote = useCallback(
    async (targetId: number) => {
      try {
        await castVote.mutateAsync({
          gameId: numericGameId,
          targetPlayerId: targetId,
        });
        toast.success("Vote cast secretly!");
      } catch (e: any) {
        toast.error(e.message || "Failed to vote");
      }
    },
    [selectedTarget, numericGameId, castVote]
  );

  const handleUseAbility = useCallback(
    async (targetId?: number) => {
      if (!selectedAbility) return;
      try {
        const result = await useAbility.mutateAsync({
          gameId: numericGameId,
          abilityName: selectedAbility,
          targetPlayerId: targetId,
        });
        setAbilityResult(result.result);
        setUsedAbility(selectedAbility);
        setShowAbilityResult(true);
        setShowAbilityPicker(false);
        setAbilityTarget(null);

        // Play sound effect for the ability
        playAbilitySound(selectedAbility);

        // Special handling for Mathlete
        if (selectedAbility === "mathlete_view" && result.result) {
          setShowMathleteRoles(true);
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to use ability");
      }
    },
    [numericGameId, useAbility, selectedAbility, playAbilitySound]
  );

  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Skull className="w-10 h-10 text-blood animate-pulse" />
      </div>
    );
  }

  // ─── RESULTS PHASE ──────────────────────────────────────────────────
  if (phase === "results") {
    const isHighSchoolWin = result === "highschool_wins";
    const isVampireWin = result === "vampire_wins";
    const allPlayers = data?.players ?? [];

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background to-blood/5">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl animate-bounce">
            {isHighSchoolWin ? "🏫" : "🧛"}
          </div>

          <h1 className="font-display text-4xl text-blood">
            {isHighSchoolWin ? "The High School Wins!" : "The Vampire Wins!"}
          </h1>

          <p className="text-muted-foreground">
            {isHighSchoolWin
              ? "The Vampire has been exposed and eliminated!"
              : "The Vampire has taken over the school!"}
          </p>

          <div className="space-y-3 mt-8">
            <p className="text-sm font-semibold text-blood/80 uppercase tracking-wider">
              Final Roles
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allPlayers.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg bg-card/50 border border-border/30 p-3"
                >
                  <div className="text-lg">{ROLE_ICONS[p.role] || "👤"}</div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                  {p.role === "Vampire" && (
                    <Skull className="w-4 h-4 text-blood" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full bg-blood hover:bg-blood/90 text-white h-12 text-base mt-8"
          >
            Play Again
          </Button>
        </div>
      </div>
    );
  }

  // ─── ROUND END PHASE ────────────────────────────────────────────────
  if (phase === "round_end") {
    const eliminated = data?.voteEliminated;
    const vampireKill = data?.vampireKill;

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background to-blood/5">
        <div className="text-center space-y-6 max-w-md">
          {eliminated && (
            <>
              <div className="text-6xl">💀</div>
              <h2 className="font-display text-3xl text-blood">
                {eliminated.displayName} was eliminated!
              </h2>
              <p className="text-lg font-semibold text-foreground">
                Role: {eliminated.role}
              </p>
              {eliminated.role === "Vampire" && (
                <p className="text-blood font-bold">The High School wins!</p>
              )}
            </>
          )}

          {vampireKill && !eliminated && (
            <>
              <div className="text-6xl">🧛</div>
              <h2 className="font-display text-3xl text-blood">
                The Vampire strikes!
              </h2>
              <p className="text-lg font-semibold text-foreground">
                {vampireKill.displayName} has been killed.
              </p>
            </>
          )}

          <p className="text-sm text-muted-foreground mt-8">
            Next round starting...
          </p>
        </div>
      </div>
    );
  }

  // ─── ABILITY PICKER SHEET ───────────────────────────────────────────
  const renderAbilityPicker = () => {
    if (!showAbilityPicker || !selectedAbility) return null;

    if (selectedAbility === "mathlete_view") {
      return (
        <Sheet open={showAbilityPicker} onOpenChange={setShowAbilityPicker}>
          <SheetContent
            side="bottom"
            className="max-h-[70dvh] bg-background border-t border-blood/20"
          >
            <SheetHeader className="pb-3">
              <SheetTitle className="font-display text-xl text-blood text-center">
                {ABILITY_BUTTON_LABELS[selectedAbility]}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-3 px-1 pb-4">
              <p className="text-xs text-muted-foreground text-center">
                Unused roles in this game:
              </p>
              <div className="space-y-2">
                {abilityResult?.unusedRoles?.map((r: Role) => (
                  <div
                    key={r}
                    className="flex items-center gap-3 rounded-lg bg-card/50 border border-border/30 p-3"
                  >
                    <span className="text-lg">{ROLE_ICONS[r]}</span>
                    <span className="font-medium text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Sheet open={showAbilityPicker} onOpenChange={setShowAbilityPicker}>
        <SheetContent
          side="bottom"
          className="max-h-[70dvh] bg-background border-t border-blood/20"
        >
          <SheetHeader className="pb-3">
            <SheetTitle className="font-display text-xl text-blood text-center">
              {ABILITY_BUTTON_LABELS[selectedAbility]}
            </SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground text-center mb-4">
            Select a player to target
          </p>
          <div className="overflow-y-auto max-h-[50dvh] space-y-2 px-1 pb-4">
            {alivePlayers.map((p: any) => {
              const isSelected = abilityTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAbilityTarget(isSelected ? null : p.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-4 border text-left transition-all duration-160 min-h-14 sm:min-h-12 ${
                    isSelected
                      ? "bg-blood/15 border-blood/50 shadow-[0_0_10px_oklch(0.5_0.28_20/0.2)]"
                      : "bg-card/50 border-border/30 hover:border-border/60"
                  } active:scale-[0.98]`}
                >
                  <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-foreground flex-1 text-sm sm:text-base">
                    {p.displayName}
                  </p>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blood shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAbilityPicker(false);
                setAbilityTarget(null);
              }}
              className="flex-1 border-border/30 h-12 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUseAbility(abilityTarget || undefined)}
              disabled={!abilityTarget || useAbility.isPending}
              className="flex-1 bg-blood hover:bg-blood/90 text-white h-12 sm:h-10"
            >
              {useAbility.isPending ? "Using..." : "Confirm"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // ─── ABILITY RESULT DIALOG ──────────────────────────────────────────
  const renderAbilityResult = () => {
    if (!showAbilityResult || !abilityResult || !usedAbility) return null;

    let resultText = "";
    let resultIcon = "✓";

    switch (usedAbility) {
      case "homecoming_fastforward":
        resultText = `You used your influence to fast-forward the discussion! Voting begins now.`;
        resultIcon = "⏩";
        break;
      case "bully_spotlight":
        resultText = `Everyone shut up! ${abilityResult.targetName} has 30 seconds to explain why they're not the Vampire.`;
        resultIcon = "🔦";
        break;
      case "gossip_queen_destroy":
        resultText = `You destroyed ${abilityResult.targetName}'s reputation! They're out of the game. But the drama caught up to you too — you're also out.`;
        resultIcon = "💥";
        break;
      case "teacher_detain":
        resultText = `${abilityResult.targetName} is in detention for 60 seconds.`;
        resultIcon = "🚪";
        break;
      case "cheerleader_peek":
        resultText = `${abilityResult.targetName} is the ${abilityResult.role}. You dated them, remember?`;
        resultIcon = "👀";
        break;
      case "dumb_jock_intimidate":
        resultText = `${abilityResult.targetName} has been intimidated and cannot vote this round.`;
        resultIcon = "💪";
        break;
      case "school_counselor_pull":
        resultText = `You and ${abilityResult.targetName} have been pulled to the office for 60 seconds.`;
        resultIcon = "🏢";
        break;
    }

    return (
      <Dialog
        open={showAbilityResult}
        onOpenChange={(open) => {
          setShowAbilityResult(open);
          if (!open) {
            setUsedAbility(null);
            setSelectedAbility(null);
          }
        }}
      >
        <DialogContent className="bg-background border-blood/20">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-2xl text-blood">
              {resultIcon} Ability Used
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-foreground py-6">{resultText}</p>
          <Button
            onClick={() => setShowAbilityResult(false)}
            className="w-full bg-blood hover:bg-blood/90 text-white"
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    );
  };

  // ─── MATHLETE ROLES VIEWER ──────────────────────────────────────────
  if (showMathleteRoles && abilityResult?.unusedRoles) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background via-background to-blood/5">
        <div className="text-center space-y-6 max-w-md">
          <h2 className="font-display text-3xl text-blood">Unused Roles</h2>
          <p className="text-sm text-muted-foreground">
            {mathleteTimer} seconds remaining
          </p>
          <div className="space-y-2">
            {abilityResult.unusedRoles.map((r: Role) => (
              <div
                key={r}
                className="flex items-center gap-3 rounded-lg bg-card/50 border border-blood/20 p-4"
              >
                <span className="text-2xl">{ROLE_ICONS[r]}</span>
                <span className="font-medium text-foreground">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER ABILITY BUTTON ──────────────────────────────────────────
  const renderAbilityButton = () => {
    if (!currentPlayer?.isAlive || phase !== "playing") return null;

    const isDetained = currentPlayer?.isDetained;
    const isAbilityBlocked = currentPlayer?.abilityBlockedUntil ? Date.now() < currentPlayer.abilityBlockedUntil : false;

    if (isDetained) {
      return (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/10 p-3 text-center">
          <Lock className="w-4 h-4 text-yellow-400/60 mx-auto mb-1" />
          <p className="text-xs text-yellow-400/60">
            You're detained! Can't use abilities right now.
          </p>
        </div>
      );
    }

    if (isAbilityBlocked) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-3 text-center">
          <Lock className="w-4 h-4 text-red-400/60 mx-auto mb-1" />
          <p className="text-xs text-red-400/60">
            Administrative leave! Your ability is blocked this round.
          </p>
        </div>
      );
    }

    // For Vampire: show all available abilities
    if (role === "Vampire") {
      return (
        <div className="space-y-2">
          <p className="text-xs text-blood/60 text-center font-semibold uppercase">
            Choose an ability to fake
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availableAbilities.map((ability) => {
              const alreadyUsed = abilityUsages.some((u: any) => u.ability === ability);
              const limit = ABILITY_LIMITS[ability];
              const usedThisRound = abilityUsages.some(
                (u: any) => u.ability === ability && u.round === round
              );
              const isDisabled =
                (limit === "once_per_game" && alreadyUsed) ||
                (limit === "once_per_round" && usedThisRound);

              return (
                <Button
                  key={ability}
                  variant="outline"
                  onClick={() => {
                    setSelectedAbility(ability);
                    if (ability === "mathlete_view" || ability === "homecoming_fastforward") {
                      handleUseAbility();
                    } else {
                      setShowAbilityPicker(true);
                    }
                  }}
                  disabled={isDisabled || useAbility.isPending}
                  className="h-auto py-2 px-2 text-xs border-blood/30 text-blood hover:bg-blood/10 transition-all duration-160 active:scale-[0.97]"
                >
                  <span className="line-clamp-2">
                    {ABILITY_BUTTON_LABELS[ability]}
                  </span>
                  {isDisabled && (
                    <span className="text-xs opacity-50 mt-1">
                      {limit === "once_per_game" ? "Used" : "Used this round"}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    // For non-Vampire: show their single ability
    if (!myAbility) return null;

    const alreadyUsed = abilityUsages.some((u: any) => u.ability === myAbility);
    const limit = ABILITY_LIMITS[myAbility];
    const usedThisRound = abilityUsages.some(
      (u: any) => u.ability === myAbility && u.round === round
    );
    const isDisabled =
      (limit === "once_per_game" && alreadyUsed) ||
      (limit === "once_per_round" && usedThisRound);

    if (isDisabled) {
      return (
        <div className="rounded-xl border border-border/20 bg-card/20 p-3 text-center">
          <p className="text-xs text-muted-foreground/60">
            {limit === "once_per_game"
              ? "Ability already used (once per game)"
              : "Ability already used this round"}
          </p>
        </div>
      );
    }

    // No-target abilities (Mathlete view, Homecoming Queen fast-forward)
    if (myAbility === "mathlete_view" || myAbility === "homecoming_fastforward") {
      return (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedAbility(myAbility);
            handleUseAbility();
          }}
          disabled={useAbility.isPending}
          className="w-full border-blood/40 text-blood hover:bg-blood/10 h-12 text-base transition-all duration-160 active:scale-[0.97]"
        >
          {useAbility.isPending ? (
            <span className="animate-pulse">Activating...</span>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              {ABILITY_BUTTON_LABELS[myAbility]}
            </>
          )}
        </Button>
      );
    }

    // Gossip Queen gets a warning-style button
    if (myAbility === "gossip_queen_destroy") {
      return (
        <Button
          variant="outline"
          onClick={() => {
            setSelectedAbility(myAbility);
            setShowAbilityPicker(true);
          }}
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 h-12 text-base transition-all duration-160 active:scale-[0.97]"
        >
          <Crosshair className="w-4 h-4 mr-2" />
          {ABILITY_BUTTON_LABELS[myAbility]}
          <span className="text-xs ml-2 opacity-60">(you're out too)</span>
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={() => {
          setSelectedAbility(myAbility);
          setShowAbilityPicker(true);
        }}
        disabled={useAbility.isPending}
        className="w-full border-blood/40 text-blood hover:bg-blood/10 h-12 text-base transition-all duration-160 active:scale-[0.97]"
      >
        <Zap className="w-4 h-4 mr-2" />
        {ABILITY_BUTTON_LABELS[myAbility]}
      </Button>
    );
  };

  // ─── GUARD: Invalid game ID ───────────────────────────────────────
  if (!isValidGameId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invalid Game ID</h1>
        <p className="text-muted-foreground mb-6">The game ID is not valid.</p>
        <Button onClick={() => navigate("/")} variant="default">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  // ─── PLAYING / VOTING PHASE ───────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-blood/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 border-b border-blood/10 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-blood" />
          <span className="font-display text-lg text-blood">
            Round {round}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={gameAudio.toggle}
            className="text-muted-foreground hover:text-foreground"
            title={gameAudio.enabled ? "Mute sound" : "Unmute sound"}
          >
            {gameAudio.enabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          <Sheet open={showRolesReference} onOpenChange={setShowRolesReference}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[80dvh] bg-background border-t border-blood/20"
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="font-display text-xl text-blood">
                  All Roles
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-3 overflow-y-auto max-h-[70dvh] px-1">
                {ROLES.map((r) => (
                  <div
                    key={r}
                    className={`rounded-lg border p-3 ${
                      r === role
                        ? "bg-blood/10 border-blood/50"
                        : "bg-card/50 border-border/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Portrait thumbnail */}
                      {ROLE_PORTRAITS[r] && (
                        <img
                          src={ROLE_PORTRAITS[r]}
                          alt={r}
                          className="w-16 h-20 object-cover rounded border border-border/30 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {r}
                          {r === role && (
                            <span className="ml-2 text-xs text-blood">
                              (YOUR ROLE)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ROLE_ABILITIES[r] || "No ability"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRole(!showRole)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showRole ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
        {/* Role Card */}
        {showRole && (
          <div className="rounded-2xl border border-blood/30 bg-gradient-to-br from-blood/10 to-blood/5 p-6 space-y-4">
            {/* Character Portrait */}
            {role && ROLE_PORTRAITS[role] && (
              <div className="flex justify-center">
                <img
                  src={ROLE_PORTRAITS[role]}
                  alt={role}
                  className="w-32 h-40 object-cover rounded-lg border-2 border-blood/30 shadow-lg"
                />
              </div>
            )}
            <div className="text-center space-y-2">
              <div className="text-6xl">{ROLE_ICONS[role] || "👤"}</div>
              <h2 className="font-display text-3xl text-blood">{role}</h2>
            </div>

            <div className="bg-background/40 rounded-lg p-4 border border-border/20">
              <p className="text-sm text-foreground">
                {ROLE_ABILITIES[role] || "No ability"}
              </p>
            </div>

            {role === "Vampire" && (
              <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400/80">
                  ⚠️ You can use ANY ability to fake your role. Be careful —
                  using abilities can expose you!
                </p>
              </div>
            )}

            {NON_VOTING_ROLES.includes(role) && (
              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-xs text-yellow-400/80">
                  ⚠️ You cannot vote, but you have a special ability!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spotlight Banner - shows when Bully ability is active */}
        {spotlightTarget && phase === "playing" && (
          <div className="rounded-xl border-2 border-yellow-500/60 bg-gradient-to-r from-yellow-950/40 to-yellow-900/20 p-4 space-y-3 shadow-[0_0_20px_oklch(0.7_0.2_60/0.3)]">
            <div className="flex items-center gap-2 justify-center">
              <Crosshair className="w-5 h-5 text-yellow-400 animate-pulse" />
              <p className="font-display text-lg text-yellow-300">SPOTLIGHT</p>
              <Crosshair className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-yellow-200 font-semibold">
                {spotlightTarget.name} has the floor!
              </p>
              <p className="text-xs text-yellow-300/80">
                Everyone else is silenced for 30 seconds
              </p>
            </div>
            {/* Spotlight timer */}
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl font-display text-yellow-300">
                {Math.max(0, Math.ceil((spotlightTarget.endsAt - Date.now()) / 1000))}s
              </div>
            </div>
          </div>
        )}

        {/* Timer */}
        {phase === "playing" && (
          <div className="rounded-xl border border-blood/20 bg-card/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">DISCUSSION TIME</p>
            <div className="font-display text-4xl text-blood">
              {data?.game?.timerEndsAt
                ? `${discussionTimer.minutes}:${discussionTimer.seconds.toString().padStart(2, "0")}`
                : "0:00"}
            </div>
          </div>
        )}

        {phase === "voting" && (
          <div className="rounded-xl border border-blood/20 bg-card/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">VOTING TIME</p>
            <div className="font-display text-3xl text-blood">
              {data?.game?.votingEndsAt
                ? `${votingTimer.minutes}:${votingTimer.seconds.toString().padStart(2, "0")}`
                : "1:30"}
            </div>
          </div>
        )}

        {/* Ability Button */}
        {phase === "playing" && renderAbilityButton()}

        {/* Voting Section */}
        {phase === "voting" && currentPlayer?.isAlive && (
          <div className="space-y-3">
            <p className="text-xs text-blood/60 text-center font-semibold uppercase">
              All voters must agree on the same person to eliminate them.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Must be unanimous! If not, the Vampire's target dies.
            </p>

            {NON_VOTING_ROLES.includes(role) ? (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/10 p-4 text-center">
                <p className="text-sm text-yellow-400/80">
                  You cannot vote this round.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alivePlayers.map((p: any) => {
                  const isSelected = selectedTarget === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        handleCastVote(isSelected ? -1 : p.id)
                      }
                      className={`w-full flex items-center gap-3 rounded-lg px-4 py-4 border transition-all duration-160 min-h-14 sm:min-h-12 ${
                        isSelected
                          ? "bg-blood/15 border-blood/50 shadow-[0_0_10px_oklch(0.5_0.28_20/0.2)]"
                          : "bg-card/50 border-border/30 hover:border-border/60"
                      } active:scale-[0.98]`}
                    >
                      <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-foreground flex-1 text-left text-sm sm:text-base">
                        {p.displayName}
                      </p>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blood shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {renderAbilityPicker()}
      {renderAbilityResult()}
    </div>
  );
}
