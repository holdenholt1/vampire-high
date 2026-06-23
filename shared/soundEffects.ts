/**
 * Sound effect mappings for all game abilities
 * Each ability type maps to its corresponding audio file URL
 * Keys must match AbilityName type from shared/types.ts
 */

export const ABILITY_SOUND_EFFECTS = {
  homecoming_fastforward: "/assets/homecoming_queen_fastforward.wav",
  bully_spotlight: "/assets/bully_spotlight.wav",
  gossip_queen_destroy: "/assets/gossip_queen_destroy.wav",
  mathlete_view: "/assets/mathlete_calculate.wav",
  teacher_detain: "/assets/teacher_detention.wav",
  cheerleader_peek: "/assets/cheerleader_peek.wav",
  dumb_jock_intimidate: "/assets/dumb_jock_strength.wav",
  school_counselor_pull: "/assets/counselor_comfort.wav",
} as const;

export type AbilityType = keyof typeof ABILITY_SOUND_EFFECTS;

/**
 * Get sound effect URL for an ability
 * @param abilityType - The ability name (e.g., "homecoming_fastforward", "bully_spotlight")
 * @returns The sound effect URL or null if not found
 */
export function getAbilitySoundEffect(abilityType: string): string | null {
  const key = abilityType as AbilityType;
  const url = ABILITY_SOUND_EFFECTS[key];
  if (!url) {
    console.warn(`No sound effect found for ability: ${abilityType}`);
  }
  return url || null;
}
