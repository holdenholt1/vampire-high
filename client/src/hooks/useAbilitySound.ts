import { useCallback, useRef } from "react";
import type { AbilityType } from "@shared/soundEffects";
import { getAbilitySoundEffect } from "@shared/soundEffects";

/**
 * Hook to play ability sound effects
 * Manages audio playback with error handling and cleanup
 */
export function useAbilitySound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Play a sound effect for an ability
   * @param abilityType - The ability type (e.g., "vampire_bite", "gossip_queen_destroy")
   * @param volume - Volume level (0-1), defaults to 0.7
   */
  const playAbilitySound = useCallback((abilityType: string, volume = 0.7) => {
    try {
      const soundUrl = getAbilitySoundEffect(abilityType as string);
      if (!soundUrl) {
        console.warn(`No sound effect found for ability: ${abilityType}`);
        return;
      }

      // Stop any currently playing sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = soundUrl;
      audioRef.current.volume = Math.max(0, Math.min(1, volume)); // Clamp volume to 0-1
      audioRef.current.play().catch((error) => {
        console.warn(`Failed to play ability sound for ${abilityType}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing ability sound:`, error);
    }
  }, []);

  /**
   * Stop the currently playing sound
   */
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { playAbilitySound, stopSound };
}
