import { useCallback, useEffect, useRef, useState } from "react";

const AUDIO_TRACKS = {
  discussion: "/assets/vampire-high-scary-music.wav",
  voting: "/assets/vampire-high-voting-music.wav",
} as const;

type TrackName = keyof typeof AUDIO_TRACKS;

// One-shot sound effect URLs
const SFX: Record<string, string> = {
  vampireKill: "/assets/vampire-kill-sfx.mp3",
  vampireCaught: "/assets/vampire-caught-cheering.mp3",
};

/**
 * A robust audio hook that:
 * - Only plays after explicit user interaction (click on sound toggle)
 * - Loops background music with fallback ended-event restart
 * - Supports one-shot sound effects that play over background music
 * - Handles all browser autoplay restrictions gracefully
 * - Never throws errors that crash the component
 * - Properly cleans up on unmount
 */
export function useGameAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackName | null>(null);
  const mountedRef = useRef(true);
  const phaseRef = useRef<string | null | undefined>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
          audioRef.current.load();
          audioRef.current = null;
        }
        if (sfxRef.current) {
          sfxRef.current.pause();
          sfxRef.current.removeAttribute("src");
          sfxRef.current.load();
          sfxRef.current = null;
        }
      } catch {
        // Silently ignore cleanup errors
      }
    };
  }, []);

  // Create or get the background music audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.loop = true;
      el.volume = 0.4;
      // Fallback: if loop doesn't work (some mobile browsers), restart manually
      el.addEventListener("ended", () => {
        try {
          if (el.loop && mountedRef.current) {
            el.currentTime = 0;
            el.play().catch(() => {});
          }
        } catch {
          // ignore
        }
      });
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  // Play a specific background track
  const playTrack = useCallback(
    (track: TrackName) => {
      if (!mountedRef.current) return;

      try {
        const audio = getAudio();
        const url = AUDIO_TRACKS[track];
        const fullUrl = window.location.origin + url;

        // Only change source if track is different
        if (audio.src !== fullUrl) {
          audio.pause();
          audio.src = url;
          audio.currentTime = 0;
          audio.loop = true; // Re-ensure loop is set
          audio.load();
        }

        setCurrentTrack(track);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked - expected, not an error
          });
        }
      } catch {
        // Silently ignore any audio errors
      }
    },
    [getAudio]
  );

  // Stop background audio
  const stop = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {
      // Silently ignore
    }
    setCurrentTrack(null);
  }, []);

  // Play a one-shot sound effect (plays over background music)
  const playSfx = useCallback(
    (sfxName: "vampireKill" | "vampireCaught") => {
      if (!enabled || !mountedRef.current) return;

      const url = SFX[sfxName];
      if (!url) return;

      try {
        // Lower background music volume during SFX
        if (audioRef.current) {
          audioRef.current.volume = 0.15;
        }

        // Create a new audio element for the SFX
        if (sfxRef.current) {
          sfxRef.current.pause();
        }
        const sfx = new Audio(url);
        sfx.volume = 0.7;
        sfx.loop = false;
        sfxRef.current = sfx;

        // Restore background volume when SFX ends
        sfx.addEventListener("ended", () => {
          try {
            if (audioRef.current && mountedRef.current) {
              audioRef.current.volume = 0.4;
            }
          } catch {
            // ignore
          }
        });

        const playPromise = sfx.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch {
        // Silently ignore
      }
    },
    [enabled]
  );

  // Toggle sound on/off
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const newState = !prev;
      if (!newState) {
        try {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          if (sfxRef.current) {
            sfxRef.current.pause();
          }
        } catch {
          // Silently ignore
        }
      }
      return newState;
    });
  }, []);

  // Phase-based audio management
  const setPhase = useCallback(
    (phase: string | undefined | null) => {
      phaseRef.current = phase;

      if (!enabled || !mountedRef.current) {
        return;
      }

      if (phase === "playing") {
        playTrack("discussion");
      } else if (phase === "voting") {
        playTrack("voting");
      } else if (phase === "round_end" || phase === "game_over") {
        // Don't stop immediately - let SFX play, then stop
        // Background music will be stopped after SFX
        stop();
      } else {
        stop();
      }
    },
    [enabled, playTrack, stop]
  );

  // When enabled changes, start/stop audio based on current phase
  useEffect(() => {
    if (enabled && phaseRef.current) {
      if (phaseRef.current === "playing") {
        playTrack("discussion");
      } else if (phaseRef.current === "voting") {
        playTrack("voting");
      }
    } else if (!enabled) {
      stop();
    }
  }, [enabled, playTrack, stop]);

  return {
    enabled,
    currentTrack,
    toggle,
    setPhase,
    stop,
    playSfx,
  };
}

// Export for updating SFX URLs after upload
export { SFX };
