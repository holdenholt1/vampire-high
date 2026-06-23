import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Users, Droplets } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

const VAMPIRE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647786178/JSRDTygb9R8fLDqMLuWRpf/vampire-hero-LMYGuRbN3NHPC3ANEWKKRK.webp";

export default function Home() {
  const [, navigate] = useLocation();
  const createGame = trpc.game.create.useMutation();
  const { t } = useLanguage();
  const [hostName, setHostName] = useState("");
  const [showNameEntry, setShowNameEntry] = useState(false);

  const handleCreate = async () => {
    // Guest mode: no login. Collect a display name, then create the lobby.
    if (!showNameEntry) {
      setShowNameEntry(true);
      return;
    }
    const name = hostName.trim();
    if (!name) {
      toast.error(t("enterName") || "Enter your name");
      return;
    }
    try {
      const result = await createGame.mutateAsync({ displayName: name });
      sessionStorage.setItem("playerToken", result.player.sessionToken);
      sessionStorage.setItem("currentGameId", String(result.game.id));
      navigate(`/lobby/${result.game.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create game");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.08_320)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,oklch(0.15_0.05_15)_0%,transparent_50%)]" />

      {/* Floating blood drops */}
      <div
        className="absolute top-10 left-[15%] opacity-20 animate-bounce"
        style={{ animationDuration: "3s" }}
      >
        <Droplets className="w-6 h-6 text-blood" />
      </div>
      <div
        className="absolute top-20 right-[20%] opacity-15 animate-bounce"
        style={{ animationDuration: "4s", animationDelay: "1s" }}
      >
        <Droplets className="w-4 h-4 text-blood" />
      </div>
      <div
        className="absolute bottom-32 left-[25%] opacity-10 animate-bounce"
        style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
      >
        <Droplets className="w-5 h-5 text-blood" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
        {/* Vampire illustration */}
        <div className="relative">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-blood/40 shadow-[0_0_30px_oklch(0.5_0.28_20/0.3)]">
            <img
              src={VAMPIRE_IMG}
              alt="Vampire"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute -inset-3 bg-blood/10 rounded-full blur-xl -z-10" />
        </div>

        {/* Title — varsity/collegiate font */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-blood-glow text-blood uppercase text-center leading-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-center text-xs sm:text-sm leading-relaxed max-w-[280px] sm:max-w-[300px]">
            {t('subtitle')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          {showNameEntry && (
            <input
              autoFocus
              value={hostName}
              onChange={(e) => setHostName(e.target.value.slice(0, 32))}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder={t("enterName") || "Your name"}
              maxLength={32}
              className="w-full h-14 sm:h-12 px-4 rounded-md bg-card border border-border/50 text-foreground text-center text-lg outline-none focus:border-blood/50"
            />
          )}
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={createGame.isPending}
            className="w-full h-14 sm:h-12 text-base sm:text-lg font-semibold bg-blood hover:bg-blood/90 text-white border-0 transition-all duration-160 active:scale-[0.97] shadow-[0_0_20px_oklch(0.5_0.28_20/0.3)] hover:shadow-[0_0_30px_oklch(0.5_0.28_20/0.5)]"
          >
            {createGame.isPending ? (
              <span className="animate-pulse">Creating...</span>
            ) : (
              <>
                <span className="mr-2 text-xl">{"\uD83E\uDDDB"}</span>
                {showNameEntry ? (t('startGame') || "Create Lobby") : t('hostGame')}
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/join")}
            className="w-full h-14 sm:h-12 text-base sm:text-lg font-semibold border-border/50 text-foreground hover:bg-accent hover:border-blood/30 transition-all duration-160 active:scale-[0.97]"
          >
            <Users className="w-5 h-5 mr-2" />
            {t('joinGame')}
          </Button>
        </div>

        {/* Footer info */}
        <p className="text-muted-foreground/50 text-xs sm:text-xs text-center px-2">
          {t('gameInfo')}
        </p>
      </div>
    </div>
  );
}
