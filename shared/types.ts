export const ROLES = [
  "Homecoming Queen",
  "Bully",
  "Gossip Queen",
  "Mathlete",
  "Teacher",
  "Dumb Cheerleader",
  "Dumb Jock",
  "Principal",
  "School Counselor",
  "Vampire",
] as const;

export type Role = (typeof ROLES)[number];

export const NON_VAMPIRE_ROLES = ROLES.filter((r) => r !== "Vampire") as Exclude<Role, "Vampire">[];

/**
 * Roles that CANNOT VOTE at all.
 * They still have their own abilities though.
 */
export const NON_VOTING_ROLES: Role[] = ["Dumb Cheerleader", "Dumb Jock"];

/**
 * Roles that cannot INITIATE a vote (legacy, kept for reference).
 * Now Dumb Cheerleader and Dumb Jock fully cannot vote.
 */
export const NON_INITIATING_ROLES: Role[] = ["Dumb Cheerleader", "Dumb Jock"];

/** Role portrait images */
export const ROLE_PORTRAITS: Record<Role, string> = {
  "Homecoming Queen": "/assets/homecoming_queen.png",
  Bully: "/assets/bully.png",
  "Gossip Queen": "/assets/gossip_queen.png",
  Mathlete: "/assets/mathlete.png",
  Teacher: "/assets/teacher.png",
  "Dumb Cheerleader": "/assets/dumb_cheerleader.png",
  "Dumb Jock": "/assets/dumb_jock.png",
  Principal: "/assets/principal.png",
  "School Counselor": "/assets/school_counselor.png",
  Vampire: "/assets/vampire.png",
};

/** Role ability descriptions */
export const ROLE_ABILITIES: Record<Role, string | null> = {
  "Homecoming Queen":
    "Has influence. Can fast-forward the discussion time to the voting phase immediately (once per game).",
  Bully:
    "Silences everyone for 30 seconds and forces one player to give their case on why they're not the Vampire.",
  "Gossip Queen":
    "One devastating hallway whisper can destroy someone's reputation forever — the targeted player is removed from the game. But once everyone realizes she started the drama, she's done too. One-time use.",
  Mathlete:
    "You can look at all roles that are NOT in the game (once per game, viewable for 30 seconds only).",
  Teacher:
    "Create 1:00 detention for any player — they sit in the corner and shut up.",
  "Dumb Cheerleader":
    "You can't vote. But you've dated everyone, so you can secretly peek at one player's role each round.",
  "Dumb Jock":
    "You can't vote. But you can intimidate one player so they can't vote this round. Resets each round.",
  Principal:
    "Can enact administrative leave on any student — they cannot use their ability for the rest of this round. Resets each round.",
  "School Counselor":
    "Can force pull any player away to a separate room with you for 1:00.",
  Vampire: null,
};

// ─── Ability System ────────────────────────────────────────────────
export type AbilityName =
  | "homecoming_fastforward"
  | "bully_spotlight"
  | "gossip_queen_destroy"
  | "mathlete_view"
  | "teacher_detain"
  | "cheerleader_peek"
  | "dumb_jock_intimidate"
  | "school_counselor_pull"
  | "principal_administrative_leave";

export interface AbilityUsage {
  id: number;
  gameId: number;
  playerId: number;
  ability: AbilityName;
  targetPlayerId: number | null;
  round: number;
  result: string | null; // JSON string for ability result data
  usedAt: number;
}

/** Which abilities reset each round vs once per game */
export const ABILITY_LIMITS: Record<AbilityName, "once_per_game" | "once_per_round"> = {
  homecoming_fastforward: "once_per_game",
  bully_spotlight: "once_per_round",
  gossip_queen_destroy: "once_per_game",
  mathlete_view: "once_per_game",
  teacher_detain: "once_per_round",
  cheerleader_peek: "once_per_round",
  dumb_jock_intimidate: "once_per_round",
  school_counselor_pull: "once_per_round",
  principal_administrative_leave: "once_per_round",
};

/** Map role to their ability name */
export const ROLE_TO_ABILITY: Record<Role, AbilityName | null> = {
  "Homecoming Queen": "homecoming_fastforward",
  Bully: "bully_spotlight",
  "Gossip Queen": "gossip_queen_destroy",
  Mathlete: "mathlete_view",
  Teacher: "teacher_detain",
  "Dumb Cheerleader": "cheerleader_peek",
  "Dumb Jock": "dumb_jock_intimidate",
  Principal: "principal_administrative_leave",
  "School Counselor": "school_counselor_pull",
  Vampire: null,
};

/**
 * Abilities that the Vampire CANNOT use when disguising.
 * The Vampire cannot use kill/elimination abilities.
 */
export const VAMPIRE_BLOCKED_ABILITIES: AbilityName[] = ["gossip_queen_destroy"];

/**
 * For Vampire: abilities that reset each round (not once_per_game)
 * This allows Vampire to use any ability in each round
 * Includes homecoming_fastforward and mathlete_view which are normally once_per_game
 */
export const VAMPIRE_ROUND_RESET_ABILITIES: AbilityName[] = [
  "homecoming_fastforward",
  "bully_spotlight",
  "mathlete_view",
  "teacher_detain",
  "cheerleader_peek",
  "dumb_jock_intimidate",
  "school_counselor_pull",
  "principal_administrative_leave",
];

// ─── Game State ─────────────────────────────────────────────────────
/**
 * Game phases:
 * - lobby: waiting for players
 * - playing: discussion timer running
 * - voting: everyone votes secretly on their phones
 * - round_end: vote results processed, vampire kill if vampire survived
 * - results: game over (win/loss)
 */
export type GamePhase = "lobby" | "playing" | "voting" | "round_end" | "results";

export type GameResult = "vampire_wins" | "highschool_wins" | null;

export interface GameState {
  id: number;
  code: string;
  hostId: number;
  phase: GamePhase;
  result: GameResult;
  round: number;
  timerEndsAt: number | null; // UTC ms timestamp
  votingEndsAt: number | null; // UTC ms timestamp
  createdAt: number;
}

export interface PlayerState {
  id: number;
  gameId: number;
  userId: number | null;
  displayName: string;
  role: Role | null;
  isAlive: boolean;
  isHost: boolean;
  votedForId: number | null;
  detainedUntil: number | null;
  voteBlocked: boolean;
  initiateBlocked: boolean;
  abilityBlockedUntil: number | null;
  joinedAt: number;
}

// ─── Game Constants ─────────────────────────────────────────────────
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;
export const GAME_CODE_LENGTH = 6;
export const DISCUSSION_DURATION_MS = 3 * 60 * 1000; // 3 minutes
export const VOTING_DURATION_MS = 2 * 60 * 1000; // 2 minutes
export const ROUND_END_DURATION_MS = 3 * 1000; // 3 seconds
export const DETENTION_DURATION_MS = 60 * 1000; // 1 minute
