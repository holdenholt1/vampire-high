import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function JoinGame() {
  const params = useParams<{ code?: string }>();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [code, setCode] = useState(params.code?.toUpperCase() || "");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<"code" | "name">(params.code ? "name" : "code");

  const joinGame = trpc.game.join.useMutation();

  useEffect(() => {
    if (params.code) {
      setCode(params.code.toUpperCase());
      setStep("name");
    }
  }, [params.code]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error(t('invalidCode'));
      return;
    }
    setStep("name");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error(t('enterName'));
      return;
    }
    try {
      const result = await joinGame.mutateAsync({
        code: code.toUpperCase(),
        displayName: displayName.trim(),
      });
      sessionStorage.setItem("playerToken", result.player.sessionToken);
      sessionStorage.setItem("currentGameId", String(result.game.id));
      navigate(`/lobby/${result.game.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to join game");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.08_320)_0%,transparent_50%)]" />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm animate-fade-in">
        <button
          onClick={() => (step === "name" && !params.code ? setStep("code") : navigate("/"))}
          className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-160"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="font-display text-3xl sm:text-4xl text-blood text-blood-glow">Join Game</h1>

        {step === "code" ? (
          <form onSubmit={handleCodeSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">Enter Game Code</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ABCDEF"
                maxLength={6}
                className="h-14 sm:h-12 text-center text-xl sm:text-2xl tracking-[0.3em] font-mono bg-card border-border/50 focus:border-blood/50 focus:ring-blood/20 placeholder:text-muted-foreground/30 placeholder:tracking-[0.3em]"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={code.length !== 6}
              className="w-full h-14 sm:h-12 text-base sm:text-lg font-semibold bg-blood hover:bg-blood/90 text-white border-0 transition-all duration-160 active:scale-[0.97] disabled:opacity-40"
            >
              Next
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
            <div className="px-3 py-2 rounded-md bg-secondary/50 text-center">
              <span className="text-xs text-muted-foreground">Game Code</span>
              <p className="text-lg font-mono tracking-[0.2em] text-foreground">{code}</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">Choose Your Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                placeholder="Enter display name..."
                maxLength={32}
                className="h-14 sm:h-12 text-base sm:text-lg bg-card border-border/50 focus:border-blood/50 focus:ring-blood/20 placeholder:text-muted-foreground/30"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!displayName.trim() || joinGame.isPending}
              className="w-full h-14 sm:h-12 text-base sm:text-lg font-semibold bg-blood hover:bg-blood/90 text-white border-0 transition-all duration-160 active:scale-[0.97] disabled:opacity-40"
            >
              {joinGame.isPending ? (
                <span className="animate-pulse">Joining...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Enter the School
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
