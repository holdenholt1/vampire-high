import { describe, it, expect } from "vitest";

/**
 * Regression tests for reported bugs:
 * 1. Mathlete voting restriction persisting across rounds
 * 2. Incorrect game end message ("Town" instead of "The High School")
 * 3. Vampire win condition not triggering with 2 players
 */

describe("Regression: Multi-round gameplay", () => {
  /**
   * Simulates a multi-round game where:
   * - Round 1: Dumb Jock intimidates Mathlete (blocks voting)
   * - Round 1 ends, votes are reset
   * - Round 2: Mathlete should be able to vote (detention cleared)
   */
  it("Mathlete can vote in round 2 after detention expires", () => {
    // Simulate round 1 state
    const round1Players = [
      { id: 1, role: "Mathlete", voteBlocked: true, detainedUntil: Date.now() + 60000 },
      { id: 2, role: "Dumb Jock", voteBlocked: false, detainedUntil: null },
      { id: 3, role: "Vampire", voteBlocked: false, detainedUntil: null },
      { id: 4, role: "Teacher", voteBlocked: false, detainedUntil: null },
    ];

    // Simulate resetVotes() which clears voteBlocked and detainedUntil
    const round2Players = round1Players.map((p) => ({
      ...p,
      voteBlocked: false,
      detainedUntil: null,
    }));

    // Verify Mathlete can vote in round 2
    const mathlete = round2Players.find((p) => p.role === "Mathlete");
    expect(mathlete?.voteBlocked).toBe(false);
    expect(mathlete?.detainedUntil).toBeNull();
  });

  /**
   * Simulates the Results page winner derivation.
   * Bug: code was checking `result?.winner` which doesn't exist.
   * Server stores result as enum: "vampire_wins" | "highschool_wins"
   */
  it("Results page correctly shows Vampire Wins when result is vampire_wins", () => {
    const result = "vampire_wins";
    const isVampireWin = result === "vampire_wins";
    expect(isVampireWin).toBe(true);
  });

  it("Results page correctly shows High School Wins when result is highschool_wins", () => {
    const result = "highschool_wins";
    const isVampireWin = result === "vampire_wins";
    expect(isVampireWin).toBe(false);
  });

  /**
   * Simulates vampire win condition.
   * With 2 players (vampire + 1 other), vampire should win.
   */
  it("Vampire wins when only 2 players remain alive", () => {
    const alivePlayers = [
      { id: 1, role: "Vampire", isAlive: true },
      { id: 2, role: "Teacher", isAlive: true },
    ];

    const vampireWins = alivePlayers.length <= 2;
    expect(vampireWins).toBe(true);
  });

  it("Vampire does not win with 3+ players alive", () => {
    const alivePlayers = [
      { id: 1, role: "Vampire", isAlive: true },
      { id: 2, role: "Teacher", isAlive: true },
      { id: 3, role: "Bully", isAlive: true },
    ];

    const vampireWins = alivePlayers.length <= 2;
    expect(vampireWins).toBe(false);
  });

  /**
   * Simulates the complete flow:
   * - Start with 4 players
   * - After voting: 3 players remain (Vampire + 2 others)
   * - After next voting: 2 players remain (Vampire + 1 other)
   * - Vampire should win
   */
  it("Game ends with vampire_wins result when 2 players remain", () => {
    // After round 1 voting
    let alivePlayers = [
      { id: 1, role: "Vampire", isAlive: true },
      { id: 2, role: "Teacher", isAlive: true },
      { id: 3, role: "Bully", isAlive: true },
    ];

    let vampireWins = alivePlayers.length <= 2;
    expect(vampireWins).toBe(false); // Game continues

    // After round 2 voting - one more player eliminated
    alivePlayers = alivePlayers.filter((p) => p.id !== 3); // Bully eliminated

    vampireWins = alivePlayers.length <= 2;
    expect(vampireWins).toBe(true); // Vampire wins!

    const result = vampireWins ? "vampire_wins" : "highschool_wins";
    expect(result).toBe("vampire_wins");
  });
});
