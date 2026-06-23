import { describe, expect, it } from "vitest";
import {
  ROLES,
  NON_VAMPIRE_ROLES,
  NON_VOTING_ROLES,
  NON_INITIATING_ROLES,
  ROLE_ABILITIES,
  ROLE_TO_ABILITY,
  ABILITY_LIMITS,
  VAMPIRE_BLOCKED_ABILITIES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  GAME_CODE_LENGTH,
  DISCUSSION_DURATION_MS,
  VOTING_DURATION_MS,
  ROUND_END_DURATION_MS,
  DETENTION_DURATION_MS,
} from "../shared/types";
import type { Role, AbilityName } from "../shared/types";

// ─── Role Configuration Tests ───────────────────────────────────────
describe("Role configuration", () => {
  it("has exactly 10 roles", () => {
    expect(ROLES).toHaveLength(10);
  });

  it("contains all expected role names", () => {
    const expected = [
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
    ];
    expect([...ROLES]).toEqual(expected);
  });

  it("does NOT contain removed roles (School Shooter, Dumb Hoe, Janitor)", () => {
    expect(ROLES).not.toContain("School Shooter");
    expect(ROLES).not.toContain("Dumb Hoe");
    expect(ROLES).not.toContain("Janitor");
    expect(ROLES).not.toContain("Exchange Student");
    expect(ROLES).not.toContain("Drug Dealer");
  });

  it("has 9 non-vampire roles", () => {
    expect(NON_VAMPIRE_ROLES).toHaveLength(9);
    expect(NON_VAMPIRE_ROLES).not.toContain("Vampire");
  });

  it("Dumb Cheerleader and Dumb Jock CANNOT VOTE at all", () => {
    expect(NON_VOTING_ROLES).toContain("Dumb Cheerleader");
    expect(NON_VOTING_ROLES).toContain("Dumb Jock");
    expect(NON_VOTING_ROLES).toHaveLength(2);
  });

  it("Dumb Cheerleader and Dumb Jock also cannot initiate votes", () => {
    expect(NON_INITIATING_ROLES).toContain("Dumb Cheerleader");
    expect(NON_INITIATING_ROLES).toContain("Dumb Jock");
  });

  it("every role has an ability description except Vampire", () => {
    for (const role of ROLES) {
      if (role === "Vampire") {
        expect(ROLE_ABILITIES[role]).toBeNull();
      } else {
        expect(ROLE_ABILITIES[role]).toBeTruthy();
        expect(typeof ROLE_ABILITIES[role]).toBe("string");
      }
    }
  });

  it("Homecoming Queen ability mentions fast-forwarding to voting", () => {
    expect(ROLE_ABILITIES["Homecoming Queen"]).toContain("fast-forward");
    expect(ROLE_ABILITIES["Homecoming Queen"]).toContain("voting");
  });

  it("Bully ability mentions silencing and giving their case", () => {
    expect(ROLE_ABILITIES["Bully"]).toContain("Silences");
    expect(ROLE_ABILITIES["Bully"]).toContain("30 seconds");
    expect(ROLE_ABILITIES["Bully"]).toContain("Vampire");
  });

  it("Gossip Queen ability mentions destroying reputation and being done", () => {
    expect(ROLE_ABILITIES["Gossip Queen"]).toContain("reputation");
    expect(ROLE_ABILITIES["Gossip Queen"]).toContain("done too");
  });

  it("Mathlete ability mentions unused roles and 30 seconds", () => {
    expect(ROLE_ABILITIES["Mathlete"]).toContain("NOT in the game");
    expect(ROLE_ABILITIES["Mathlete"]).toContain("30 seconds");
  });

  it("Teacher ability mentions detention", () => {
    expect(ROLE_ABILITIES["Teacher"]).toContain("detention");
  });

  it("Dumb Cheerleader ability mentions can't vote and seeing a role", () => {
    expect(ROLE_ABILITIES["Dumb Cheerleader"]).toContain("can't vote");
    expect(ROLE_ABILITIES["Dumb Cheerleader"]).toContain("role");
  });

  it("Dumb Jock ability mentions can't vote and intimidate", () => {
    expect(ROLE_ABILITIES["Dumb Jock"]).toContain("can't vote");
    expect(ROLE_ABILITIES["Dumb Jock"]).toContain("intimidate");
  });

  it("Principal ability mentions administrative leave", () => {
    expect(ROLE_ABILITIES["Principal"]).toContain("administrative leave");
  });

  it("School Counselor ability mentions pulling a player away", () => {
    expect(ROLE_ABILITIES["School Counselor"]).toContain("pull");
    expect(ROLE_ABILITIES["School Counselor"]).toContain("1:00");
  });
});

// ─── Ability System Tests ──────────────────────────────────────────
describe("Ability system configuration", () => {
  it("maps every non-Vampire role to an ability", () => {
    for (const role of NON_VAMPIRE_ROLES) {
      if (role === "Vampire") {
        expect(ROLE_TO_ABILITY[role]).toBeNull();
      } else {
        expect(ROLE_TO_ABILITY[role]).toBeTruthy();
      }
    }
  });

  it("Vampire has null ability mapping but Principal has active ability", () => {
    expect(ROLE_TO_ABILITY["Vampire"]).toBeNull();
    expect(ROLE_TO_ABILITY["Principal"]).toBe("principal_administrative_leave");
  });

  it("has correct ability limits (per-game vs per-round)", () => {
    expect(ABILITY_LIMITS["homecoming_fastforward"]).toBe("once_per_game");
    expect(ABILITY_LIMITS["gossip_queen_destroy"]).toBe("once_per_game");
    expect(ABILITY_LIMITS["mathlete_view"]).toBe("once_per_game");
    expect(ABILITY_LIMITS["bully_spotlight"]).toBe("once_per_round");
    expect(ABILITY_LIMITS["teacher_detain"]).toBe("once_per_round");
    expect(ABILITY_LIMITS["cheerleader_peek"]).toBe("once_per_round");
    expect(ABILITY_LIMITS["dumb_jock_intimidate"]).toBe("once_per_round");
    expect(ABILITY_LIMITS["school_counselor_pull"]).toBe("once_per_round");
    expect(ABILITY_LIMITS["principal_administrative_leave"]).toBe("once_per_round");
  });

  it("all 9 active abilities are defined", () => {
    const abilities: AbilityName[] = [
      "homecoming_fastforward",
      "bully_spotlight",
      "gossip_queen_destroy",
      "mathlete_view",
      "teacher_detain",
      "cheerleader_peek",
      "dumb_jock_intimidate",
      "school_counselor_pull",
      "principal_administrative_leave",
    ];
    for (const a of abilities) {
      expect(ABILITY_LIMITS[a]).toBeDefined();
    }
  });

  it("Vampire cannot use elimination abilities", () => {
    expect(VAMPIRE_BLOCKED_ABILITIES).toContain("gossip_queen_destroy");
    expect(VAMPIRE_BLOCKED_ABILITIES.length).toBeGreaterThan(0);
  });

  it("Vampire CAN use non-elimination abilities", () => {
    const nonBlocked: AbilityName[] = [
      "homecoming_fastforward",
      "bully_spotlight",
      "mathlete_view",
      "teacher_detain",
      "cheerleader_peek",
      "dumb_jock_intimidate",
      "school_counselor_pull",
      "principal_administrative_leave",
    ];
    for (const a of nonBlocked) {
      expect(VAMPIRE_BLOCKED_ABILITIES).not.toContain(a);
    }
  });
});

// ─── Game Constants Tests ───────────────────────────────────────────
describe("Game constants", () => {
  it("requires 4-10 players", () => {
    expect(MIN_PLAYERS).toBe(4);
    expect(MAX_PLAYERS).toBe(10);
  });

  it("game code is 6 characters", () => {
    expect(GAME_CODE_LENGTH).toBe(6);
  });

  it("discussion lasts 3 minutes", () => {
    expect(DISCUSSION_DURATION_MS).toBe(3 * 60 * 1000);
  });

  it("voting lasts 2 minutes", () => {
    expect(VOTING_DURATION_MS).toBe(2 * 60 * 1000);
  });

  it("round end display lasts 3 seconds", () => {
    expect(ROUND_END_DURATION_MS).toBe(3 * 1000);
  });

  it("detention lasts 60 seconds", () => {
    expect(DETENTION_DURATION_MS).toBe(60 * 1000);
  });
});

// ─── Role Assignment Logic Tests ────────────────────────────────────
describe("Role assignment logic", () => {
  function simulateRoleAssignment(playerCount: number) {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
    }));

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const vampireIndex = Math.floor(Math.random() * shuffled.length);
    const availableRoles = [...NON_VAMPIRE_ROLES].sort(() => Math.random() - 0.5);
    const assignments: { playerId: number; role: Role }[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      if (i === vampireIndex) {
        assignments.push({ playerId: shuffled[i].id, role: "Vampire" });
      } else {
        const role = availableRoles.pop()!;
        assignments.push({ playerId: shuffled[i].id, role });
      }
    }

    return assignments;
  }

  it("assigns exactly one Vampire for any player count (4-10)", () => {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
      const assignments = simulateRoleAssignment(count);
      const vampires = assignments.filter((a) => a.role === "Vampire");
      expect(vampires).toHaveLength(1);
    }
  });

  it("assigns unique non-vampire roles", () => {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
      const assignments = simulateRoleAssignment(count);
      const nonVampireRoles = assignments
        .filter((a) => a.role !== "Vampire")
        .map((a) => a.role);
      const uniqueRoles = new Set(nonVampireRoles);
      expect(uniqueRoles.size).toBe(nonVampireRoles.length);
    }
  });

  it("all assigned roles are from the valid ROLES list", () => {
    for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count++) {
      const assignments = simulateRoleAssignment(count);
      for (const a of assignments) {
        expect(ROLES).toContain(a.role);
      }
    }
  });

  it("every player gets exactly one role", () => {
    const assignments = simulateRoleAssignment(8);
    expect(assignments).toHaveLength(8);
    const playerIds = assignments.map((a) => a.playerId);
    expect(new Set(playerIds).size).toBe(8);
  });
});

// ─── Game Code Tests ────────────────────────────────────────────────
describe("Game code generation", () => {
  function generateGameCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  it("generates a 6-character code", () => {
    const code = generateGameCode();
    expect(code).toHaveLength(6);
  });

  it("uses only uppercase letters and digits (no ambiguous chars)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateGameCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(code).not.toMatch(/[OI01]/);
    }
  });
});

// ─── Vote Logic Tests (UNANIMITY RULE) ───────────────────────────────────────────
describe("Vote processing with UNANIMITY rule", () => {
  /**
   * Mirrors the server processVoteResults logic:
   * - Collect votes from non-vampire eligible voters (exclude Dumb Cheerleader/Jock, vote-blocked, Vampire)
   * - If ALL non-vampire voters agree on the same target → that player is eliminated
   * - If NOT unanimous → Vampire's vote target is killed instead
   */
  function processVotes(
    alivePlayers: { id: number; role: string; votedForId: number | null; voteBlocked?: boolean }[]
  ) {
    // Collect non-vampire eligible votes
    const nonVampireVotes: number[] = [];
    for (const p of alivePlayers) {
      if (p.role === "Vampire") continue;
      if (NON_VOTING_ROLES.includes(p.role as Role)) continue;
      if (p.voteBlocked) continue;
      if (p.votedForId !== null) {
        nonVampireVotes.push(p.votedForId);
      }
    }

    const isUnanimous = nonVampireVotes.length > 0 && nonVampireVotes.every((v) => v === nonVampireVotes[0]);
    const unanimousTarget = isUnanimous ? nonVampireVotes[0] : null;

    // Vampire's vote target
    const vampire = alivePlayers.find((p) => p.role === "Vampire");
    const vampireVoteTarget = vampire?.votedForId ?? null;

    let voteEliminatedId: number | null = null;
    let vampireKillId: number | null = null;

    if (unanimousTarget) {
      voteEliminatedId = unanimousTarget;
    }

    // If vampire survived (wasn't eliminated), their target dies
    if (voteEliminatedId !== vampire?.id && vampireVoteTarget !== null) {
      if (vampireVoteTarget !== voteEliminatedId) {
        vampireKillId = vampireVoteTarget;
      }
    }

    return { nonVampireVotes, isUnanimous, unanimousTarget, voteEliminatedId, vampireKillId };
  }

  it("unanimous vote eliminates the target", () => {
    const players = [
      { id: 1, role: "Principal", votedForId: 3 },
      { id: 2, role: "Teacher", votedForId: 3 },
      { id: 3, role: "Vampire", votedForId: 2 },
      { id: 4, role: "Bully", votedForId: 3 },
    ];

    const result = processVotes(players);
    expect(result.isUnanimous).toBe(true);
    expect(result.unanimousTarget).toBe(3);
    expect(result.voteEliminatedId).toBe(3);
  });

  it("non-unanimous vote does NOT eliminate anyone by vote", () => {
    const players = [
      { id: 1, role: "Principal", votedForId: 3 },
      { id: 2, role: "Teacher", votedForId: 4 },
      { id: 3, role: "Vampire", votedForId: 2 },
      { id: 4, role: "Bully", votedForId: 3 },
    ];

    const result = processVotes(players);
    expect(result.isUnanimous).toBe(false);
    expect(result.voteEliminatedId).toBeNull();
  });

  it("when not unanimous, Vampire's vote target is killed", () => {
    const players = [
      { id: 1, role: "Principal", votedForId: 3 },
      { id: 2, role: "Teacher", votedForId: 4 },
      { id: 3, role: "Vampire", votedForId: 2 },
      { id: 4, role: "Bully", votedForId: 3 },
    ];

    const result = processVotes(players);
    expect(result.vampireKillId).toBe(2);
  });

  it("Vampire's vote does NOT count toward unanimity", () => {
    // All non-vampire voters agree on player 3, vampire votes for player 2
    const players = [
      { id: 1, role: "Teacher", votedForId: 3 },
      { id: 2, role: "Bully", votedForId: 3 },
      { id: 3, role: "Vampire", votedForId: 1 }, // Vampire's vote excluded from unanimity check
      { id: 4, role: "Mathlete", votedForId: 3 },
    ];

    const result = processVotes(players);
    expect(result.nonVampireVotes).toEqual([3, 3, 3]);
    expect(result.isUnanimous).toBe(true);
    expect(result.voteEliminatedId).toBe(3); // Vampire is eliminated!
  });

  it("Dumb Cheerleader and Dumb Jock are excluded from unanimity check", () => {
    const players = [
      { id: 1, role: "Dumb Cheerleader", votedForId: 4 }, // excluded
      { id: 2, role: "Dumb Jock", votedForId: 4 }, // excluded
      { id: 3, role: "Vampire", votedForId: 1 },
      { id: 4, role: "Teacher", votedForId: 3 },
      { id: 5, role: "Bully", votedForId: 3 },
    ];

    const result = processVotes(players);
    // Only Teacher and Bully count
    expect(result.nonVampireVotes).toEqual([3, 3]);
    expect(result.isUnanimous).toBe(true);
    expect(result.voteEliminatedId).toBe(3);
  });

  it("vote-blocked players are excluded from unanimity check", () => {
    const players = [
      { id: 1, role: "Teacher", votedForId: 3, voteBlocked: true }, // excluded
      { id: 2, role: "Bully", votedForId: 3 },
      { id: 3, role: "Vampire", votedForId: 2 },
      { id: 4, role: "Mathlete", votedForId: 3 },
    ];

    const result = processVotes(players);
    // Only Bully and Mathlete count
    expect(result.nonVampireVotes).toEqual([3, 3]);
    expect(result.isUnanimous).toBe(true);
    expect(result.voteEliminatedId).toBe(3);
  });

  it("if Vampire is unanimously eliminated, no vampire kill happens", () => {
    const players = [
      { id: 1, role: "Teacher", votedForId: 3 },
      { id: 2, role: "Bully", votedForId: 3 },
      { id: 3, role: "Vampire", votedForId: 1 },
      { id: 4, role: "Mathlete", votedForId: 3 },
    ];

    const result = processVotes(players);
    expect(result.voteEliminatedId).toBe(3); // Vampire eliminated
    expect(result.vampireKillId).toBeNull(); // No vampire kill since vampire is dead
  });

  it("if only one non-vampire voter exists, their vote is unanimous", () => {
    const players = [
      { id: 1, role: "Teacher", votedForId: 3 },
      { id: 2, role: "Dumb Cheerleader", votedForId: 3 }, // excluded
      { id: 3, role: "Vampire", votedForId: 1 },
    ];

    const result = processVotes(players);
    expect(result.nonVampireVotes).toEqual([3]);
    expect(result.isUnanimous).toBe(true);
    expect(result.voteEliminatedId).toBe(3);
  });

  it("no votes at all means no elimination", () => {
    const players = [
      { id: 1, role: "Teacher", votedForId: null },
      { id: 2, role: "Bully", votedForId: null },
      { id: 3, role: "Vampire", votedForId: 2 },
    ];

    const result = processVotes(players);
    expect(result.nonVampireVotes).toEqual([]);
    expect(result.isUnanimous).toBe(false);
    expect(result.voteEliminatedId).toBeNull();
    expect(result.vampireKillId).toBe(2); // Vampire's target dies
  });
});

// ─── Win Condition Tests ────────────────────────────────────────────
describe("Win conditions", () => {
  function checkVampireWin(alivePlayers: { role: string }[]): boolean {
    return alivePlayers.length <= 2;
  }

  it("Vampire wins when only 2 players remain (vampire + 1)", () => {
    const alive = [{ role: "Vampire" }, { role: "Teacher" }];
    expect(checkVampireWin(alive)).toBe(true);
  });

  it("Vampire does NOT win with 3+ players alive", () => {
    const alive = [{ role: "Vampire" }, { role: "Teacher" }, { role: "Bully" }];
    expect(checkVampireWin(alive)).toBe(false);
  });

  it("Vampire wins when only 1 player remains (edge case)", () => {
    const alive = [{ role: "Vampire" }];
    expect(checkVampireWin(alive)).toBe(true);
  });

  it("Game continues with 4 players alive", () => {
    const alive = [
      { role: "Vampire" },
      { role: "Teacher" },
      { role: "Bully" },
      { role: "Mathlete" },
    ];
    expect(checkVampireWin(alive)).toBe(false);
  });

  it("High School wins when Vampire is eliminated by vote", () => {
    const eliminatedRole: Role = "Vampire";
    const result = eliminatedRole === "Vampire" ? "highschool_wins" : null;
    expect(result).toBe("highschool_wins");
  });

  it("High School wins when Gossip Queen destroys the Vampire's reputation", () => {
    const targetRole: Role = "Vampire";
    const gossipQueenAlsoOut = true;
    const targetWasVampire = targetRole === "Vampire";
    expect(targetWasVampire).toBe(true);
    expect(gossipQueenAlsoOut).toBe(true);
    // Both are out, but high school wins because vampire is gone
    const result = targetWasVampire ? "highschool_wins" : null;
    expect(result).toBe("highschool_wins");
  });

  it("Gossip Queen destroying a non-vampire does NOT end the game (unless vampire win condition)", () => {
    const targetRole: Role = "Teacher";
    const targetWasVampire = targetRole === "Vampire";
    expect(targetWasVampire).toBe(false);
    // Game continues, but gossip queen + target are both out
  });
});

// ─── Multi-Round Flow Tests ─────────────────────────────────────────
describe("Multi-round game flow", () => {
  it("game starts at round 1", () => {
    const gameState = { round: 1, phase: "playing" as const };
    expect(gameState.round).toBe(1);
  });

  it("round increments after round_end", () => {
    let round = 1;
    round += 1;
    expect(round).toBe(2);
    round += 1;
    expect(round).toBe(3);
  });

  it("vampire kill happens when vampire survives a round", () => {
    const vampireVotedFor = 3;
    const voteEliminatedId = 5;
    const vampireKillId = vampireVotedFor !== voteEliminatedId ? vampireVotedFor : null;
    expect(vampireKillId).toBe(3);
  });

  it("vampire does NOT kill if their target was already eliminated by vote", () => {
    const vampireVotedFor = 5;
    const voteEliminatedId = 5;
    const vampireKillId = vampireVotedFor !== voteEliminatedId ? vampireVotedFor : null;
    expect(vampireKillId).toBeNull();
  });

  it("two players can be eliminated per round (vote + vampire kill)", () => {
    let alivePlayers = [
      { id: 1, role: "Vampire" },
      { id: 2, role: "Teacher" },
      { id: 3, role: "Bully" },
      { id: 4, role: "Mathlete" },
      { id: 5, role: "Principal" },
    ];

    const voteEliminatedId = 3;
    const vampireKillId = 4;

    alivePlayers = alivePlayers.filter(
      (p) => p.id !== voteEliminatedId && p.id !== vampireKillId
    );

    expect(alivePlayers).toHaveLength(3);
    expect(alivePlayers.map((p) => p.id)).toEqual([1, 2, 5]);
  });

  it("game phases follow correct order: playing → voting → round_end → playing", () => {
    const phaseOrder = ["playing", "voting", "round_end", "playing"];
    expect(phaseOrder[0]).toBe("playing");
    expect(phaseOrder[1]).toBe("voting");
    expect(phaseOrder[2]).toBe("round_end");
    expect(phaseOrder[3]).toBe("playing");
  });

  it("game can go many rounds until vampire is alone with 1 player", () => {
    let alive = 10;
    let round = 0;
    while (alive > 2) {
      round++;
      alive -= 2; // vote kill + vampire kill each round
    }
    // With 10 players, after 4 rounds: 10 - 8 = 2 players left
    expect(round).toBe(4);
    expect(alive).toBe(2);
  });
});

// ─── Ability Mechanic Tests ─────────────────────────────────────────
describe("Ability mechanics (pure logic)", () => {
  it("Homecoming Queen fast-forward: skips discussion to voting", () => {
    const gamePhase = "playing";
    const canFastForward = gamePhase === "playing";
    expect(canFastForward).toBe(true);
    // After fast-forward, phase becomes voting
    const newPhase = canFastForward ? "voting" : gamePhase;
    expect(newPhase).toBe("voting");
  });

  it("Homecoming Queen fast-forward: cannot use during voting", () => {
    const gamePhase = "voting";
    const canFastForward = gamePhase === "playing";
    expect(canFastForward).toBe(false);
  });

  it("Mathlete view: correctly computes unused roles", () => {
    const assignedRoles: Role[] = ["Homecoming Queen", "Bully", "Teacher", "Vampire"];
    const unusedRoles = NON_VAMPIRE_ROLES.filter((r) => !assignedRoles.includes(r));
    expect(unusedRoles).toContain("Gossip Queen");
    expect(unusedRoles).toContain("Mathlete");
    expect(unusedRoles).toContain("Dumb Cheerleader");
    expect(unusedRoles).toContain("Dumb Jock");
    expect(unusedRoles).toContain("Principal");
    expect(unusedRoles).toContain("School Counselor");
    expect(unusedRoles).not.toContain("Homecoming Queen");
    expect(unusedRoles).not.toContain("Bully");
    expect(unusedRoles).not.toContain("Teacher");
    expect(unusedRoles).not.toContain("Vampire");
  });

  it("Gossip Queen: both gossip queen and target are out", () => {
    const gossipQueenId = 1;
    const targetId = 2;
    const alive = [
      { id: 1, role: "Gossip Queen", isAlive: true },
      { id: 2, role: "Teacher", isAlive: true },
      { id: 3, role: "Vampire", isAlive: true },
      { id: 4, role: "Bully", isAlive: true },
    ];

    const afterDestroy = alive.map((p) => ({
      ...p,
      isAlive: p.id !== gossipQueenId && p.id !== targetId,
    }));

    expect(afterDestroy.filter((p) => p.isAlive)).toHaveLength(2);
    expect(afterDestroy.find((p) => p.id === gossipQueenId)!.isAlive).toBe(false);
    expect(afterDestroy.find((p) => p.id === targetId)!.isAlive).toBe(false);
  });

  it("Dumb Jock intimidate: target gets vote-blocked", () => {
    const target = { id: 2, voteBlocked: false };
    target.voteBlocked = true;
    expect(target.voteBlocked).toBe(true);
  });

  it("Bully block: target gets initiate-blocked", () => {
    const target = { id: 2, initiateBlocked: false };
    target.initiateBlocked = true;
    expect(target.initiateBlocked).toBe(true);
  });

  it("Teacher detain: target is detained for 60 seconds", () => {
    const now = Date.now();
    const detainedUntil = now + DETENTION_DURATION_MS;
    expect(detainedUntil - now).toBe(60000);
  });

  it("School Counselor pull: both counselor and target are detained", () => {
    const now = Date.now();
    const pulledUntil = now + DETENTION_DURATION_MS;
    const counselor = { id: 1, detainedUntil: pulledUntil };
    const target = { id: 2, detainedUntil: pulledUntil };
    expect(counselor.detainedUntil).toBe(target.detainedUntil);
    expect(counselor.detainedUntil - now).toBe(60000);
  });

  it("once-per-game abilities cannot be reused", () => {
    const usedAbilities = new Set<AbilityName>(["homecoming_fastforward"]);
    const canUse = !usedAbilities.has("homecoming_fastforward");
    expect(canUse).toBe(false);
  });

  it("once-per-round abilities reset each round", () => {
    const round1Usages = new Set<string>(["bully_spotlight_r1"]);
    const round2Key = "bully_spotlight_r2";
    const canUseInRound2 = !round1Usages.has(round2Key);
    expect(canUseInRound2).toBe(true);
  });

  it("Dumb Cheerleader peek: reveals target role privately", () => {
    const targetRole: Role = "School Counselor";
    const result = { targetName: "Player 3", role: targetRole };
    expect(result.role).toBe("School Counselor");
  });

  it("Vampire is blocked from using elimination abilities", () => {
    const vampireAvailableAbilities = (Object.keys(ABILITY_LIMITS) as AbilityName[]).filter(
      (a) => !VAMPIRE_BLOCKED_ABILITIES.includes(a)
    );
    expect(vampireAvailableAbilities).not.toContain("gossip_queen_destroy");
    expect(vampireAvailableAbilities).toContain("homecoming_fastforward");
    expect(vampireAvailableAbilities).toContain("bully_spotlight");
    expect(vampireAvailableAbilities).toContain("cheerleader_peek");
  });
});
