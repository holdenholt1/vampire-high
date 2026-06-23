import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Play, Users, Skull, Crown, Link, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MIN_PLAYERS, MAX_PLAYERS } from "../../../shared/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

/** Detect if we're running in the sandbox preview (not the published site) */
function isPreviewMode(): boolean {
  const host = window.location.hostname;
  return host.includes("manus.computer") || host.includes("localhost") || host.includes("127.0.0.1");
}

export default function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const numericGameId = Number(gameId);
  const preview = isPreviewMode();

  const { data, isLoading, error } = trpc.game.lobby.useQuery(
    { gameId: numericGameId },
    {
      refetchInterval: 1500,
      enabled: !!numericGameId,
    }
  );

  const startGame = trpc.game.start.useMutation();

  // Navigate to game when phase changes
  useEffect(() => {
    if (data?.game.phase === "playing" || data?.game.phase === "voting") {
      navigate(`/game/${numericGameId}`);
    }
  }, [data?.game.phase, numericGameId, navigate]);

  const joinUrl = useMemo(() => {
    if (!data?.game.code) return "";
    return `${window.location.origin}/join/${data.game.code}`;
  }, [data?.game.code]);

  const isHost = data?.players.some(
    (p) => p.id === data.currentPlayerId && p.isHost
  );
  const playerCount = data?.players.length ?? 0;
  const canStart = isHost && playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS;

  const handleCopyCode = () => {
    if (data?.game.code) {
      navigator.clipboard.writeText(data.game.code);
      toast.success(t('success'));
    }
  };

  const handleCopyLink = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl);
      toast.success(t('success'));
    }
  };

  const handleStart = async () => {
    try {
      await startGame.mutateAsync({ gameId: numericGameId });
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Skull className="w-10 h-10 text-blood animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive">Game not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.08_320)_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl text-blood text-blood-glow mb-1">{t('waitingRoom')}</h1>
          <p className="text-muted-foreground text-sm">{t('shareCode')}</p>
        </div>

        {/* Preview Mode Warning */}
        {preview && (
          <div className="w-full bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Preview Mode</p>
              <p className="text-xs text-amber-400/70 mt-1">
                The QR code and join link won't work for other devices in preview mode. 
                Publish the app first, then the QR code will point to the live URL. 
                For now, players can join on <span className="font-semibold">this same device</span> or 
                share the <span className="font-semibold">game code</span> to enter manually on the published site.
              </p>
            </div>
          </div>
        )}

        {/* Game Code */}
        <div className="w-full bg-card border border-border/50 rounded-xl p-5 flex flex-col items-center gap-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('gameCode')}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-3 group"
          >
            <span className="text-4xl font-mono tracking-[0.3em] text-foreground font-bold">
              {data.game.code}
            </span>
            <Copy className="w-5 h-5 text-muted-foreground group-hover:text-blood transition-colors duration-160" />
          </button>
          <p className="text-xs text-muted-foreground">{t('tapCodeToCopy')}</p>

          {/* QR Code — only show when not in preview */}
          {!preview && (
            <>
              <div className="w-full h-px bg-border/30" />
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  value={joinUrl}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a0a1e"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('scanToJoin')}</p>
            </>
          )}

          {/* Copy join link button */}
          {!preview && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-blood transition-colors duration-160"
            >
              <Link className="w-3 h-3" />
              {t('copyJoinLink')}
            </button>
          )}
        </div>

        {/* Player List */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Players ({playerCount}/{MAX_PLAYERS})
              </span>
            </div>
            {playerCount < MIN_PLAYERS && (
              <span className="text-xs text-blood">
                {t('needMore')} {MIN_PLAYERS - playerCount}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {data.players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-card/50 border border-border/30 rounded-lg px-4 py-3 sm:py-2 animate-slide-up min-h-12 sm:min-h-10"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                  {player.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-foreground font-medium flex-1 text-sm sm:text-base">
                  {player.displayName}
                </span>
                {player.isHost && (
                  <Crown className="w-4 h-4 text-blood shrink-0" />
                )}
                {player.id === data.currentPlayerId && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                    {t('you')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Button (host only) */}
        {isHost && (
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!canStart || startGame.isPending}
            className="w-full h-14 sm:h-12 text-base sm:text-lg font-semibold bg-blood hover:bg-blood/90 text-white border-0 transition-all duration-160 active:scale-[0.97] disabled:opacity-40 shadow-[0_0_20px_oklch(0.5_0.28_20/0.3)] hover:shadow-[0_0_30px_oklch(0.5_0.28_20/0.5)]"
          >
            {startGame.isPending ? (
              <span className="animate-pulse">Starting...</span>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {canStart
                  ? "Begin the Night"
                  : `Need ${MIN_PLAYERS - playerCount} more players`}
              </>
            )}
          </Button>
        )}

        {!isHost && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm animate-pulse">
              Waiting for the host to start the game...
            </p>
          </div>
        )}

        {/* Language Toggle */}
        <div className="mt-6 pt-4 border-t border-border/30 w-full flex justify-center">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
