import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createGame,
  getGameByCode,
  getGameById,
  updateGame,
  addPlayer,
  getPlayersByGameId,
  getPlayerByToken,
  getPlayerById,
  assignRoles,
  castVote,
  eliminatePlayer,
  resetVotes,
  getVoteTally,
  setPlayerDetained,
  setPlayerVoteBlocked,
  setPlayerInitiateBlocked,
  setPlayerAbilityBlocked,
  recordAbilityUsage,
  getAbilityUsages,
  getAbilityUsagesForRound,
  getAllAbilityUsagesForGame,
} from "./db";
import {
  ROLES,
  NON_VAMPIRE_ROLES,
  SPECIAL_ROLES,
  NON_VOTING_ROLES,
  NON_INITIATING_ROLES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  DISCUSSION_DURATION_MS,
  VOTING_DURATION_MS,
  ROUND_END_DURATION_MS,
  DETENTION_DURATION_MS,
  ABILITY_LIMITS,
  ROLE_TO_ABILITY,
  VAMPIRE_BLOCKED_ABILITIES,
  VAMPIRE_ROUND_RESET_ABILITIES,
} from "../shared/types";
import type { Role, AbilityName } from "../shared/types";

// ─── Helper: get player from session token header ───────────────────
async function getPlayerFromRequest(req: any) {
  const token = req.headers["x-player-token"] as string | undefined;
  if (!token) return undefined;
  return getPlayerByToken(token);
}

/**
 * Check if vampire wins: only 2 players remain alive (vampire + 1 other)
 */
function checkVampireWinCondition(alivePlayers: { role: string | null }[]): boolean {
  return alivePlayers.length <= 2;
}

/**
 * Check if ability has been used already (respecting once_per_game vs once_per_round limits)
 * For Vampire: certain abilities reset each round even though they're normally once_per_game
 */
async function hasAbilityBeenUsed(
  gameId: number,
  playerId: number,
  ability: AbilityName,
  currentRound: number,
  playerRole: string | null
): Promise<boolean> {
  // For Vampire: check if this ability should reset each round
  if (playerRole === "Vampire" && VAMPIRE_ROUND_RESET_ABILITIES.includes(ability)) {
    const usages = await getAbilityUsagesForRound(gameId, playerId, currentRound);
    return usages.some((u) => u.ability === ability);
  }

  const limit = ABILITY_LIMITS[ability];
  if (limit === "once_per_game") {
    const usages = await getAbilityUsages(gameId, playerId);
    return usages.some((u) => u.ability === ability);
  } else {
    // once_per_round
    const usages = await getAbilityUsagesForRound(gameId, playerId, currentRound);
    return usages.some((u) => u.ability === ability);
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  game: router({
    // ─── Create a new game lobby (guest host — no login required) ────
    create: publicProcedure
      .input(
        z.object({
          displayName: z.string().min(1).max(32),
        })
      )
      .mutation(async ({ input }) => {
        // Guest-only: no platform user. Host is created as a guest player and
        // identified going forward by their sessionToken (x-player-token).
        const game = await createGame(null);
        const hostPlayer = await addPlayer(game.id, input.displayName.trim(), null, true);
        return { game, player: hostPlayer };
      }),

    // ─── Join a game by code (no auth required) ─────────────────────
    join: publicProcedure
      .input(
        z.object({
          code: z.string().length(6),
          displayName: z.string().min(1).max(32),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const game = await getGameByCode(input.code.toUpperCase());
        if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
        if (game.phase !== "lobby")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });

        const existingPlayers = await getPlayersByGameId(game.id);
        if (existingPlayers.length >= MAX_PLAYERS)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Game is full" });

        if (existingPlayers.some((p) => p.displayName.toLowerCase() === input.displayName.toLowerCase()))
          throw new TRPCError({ code: "BAD_REQUEST", message: "Name already taken" });

        const userId = ctx.user?.id ?? null;
        const player = await addPlayer(game.id, input.displayName, userId, false);
        return { game, player };
      }),

    // ─── Get lobby state (polling) ──────────────────────────────────
    lobby: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
        const allPlayers = await getPlayersByGameId(game.id);
        return {
          game: {
            id: game.id,
            code: game.code,
            hostUserId: game.hostUserId,
            phase: game.phase,
            result: game.result,
            round: game.round,
            timerEndsAt: game.timerEndsAt,
            votingEndsAt: game.votingEndsAt,
            createdAt: game.createdAt?.getTime() ?? Date.now(),
          },
          players: allPlayers.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            isHost: p.isHost,
            isAlive: p.isAlive,
          })),
          currentPlayerId: player?.id ?? null,
        };
      }),

    // ─── Start the game (host only) ─────────────────────────────────
    start: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        if (!player || !player.isHost)
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can start the game" });

        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });
        if (game.phase !== "lobby")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });

        const allPlayers = await getPlayersByGameId(game.id);
        if (allPlayers.length < MIN_PLAYERS)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Need at least ${MIN_PLAYERS} players`,
          });

        // ── Assign roles ──
        // Exactly 1 Vampire. The 9 special roles are dealt out first (one each);
        // any remaining players become plain Students.
        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
        const vampireIndex = Math.floor(Math.random() * shuffled.length);
        const availableRoles = [...SPECIAL_ROLES].sort(() => Math.random() - 0.5);
        const assignments: { playerId: number; role: Role }[] = [];

        for (let i = 0; i < shuffled.length; i++) {
          if (i === vampireIndex) {
            assignments.push({ playerId: shuffled[i].id, role: "Vampire" });
          } else {
            const role = availableRoles.pop() ?? "Student";
            assignments.push({ playerId: shuffled[i].id, role });
          }
        }

        await assignRoles(game.id, assignments);

        const timerEndsAt = Date.now() + DISCUSSION_DURATION_MS;
        await updateGame(game.id, { phase: "playing", timerEndsAt, round: 1 });

        return { success: true };
      }),

    // ─── Get game state for a player (during play) ──────────────────
    state: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Game not found" });

        const allPlayers = await getPlayersByGameId(game.id);

        // Auto-transition: if playing and timer expired, move to voting
        if (game.phase === "playing" && game.timerEndsAt && Date.now() >= game.timerEndsAt) {
          const votingEndsAt = Date.now() + VOTING_DURATION_MS;
          await updateGame(game.id, { phase: "voting", votingEndsAt });
          game.phase = "voting";
          (game as any).votingEndsAt = votingEndsAt;
        }

        // Auto-transition: if voting and voting timer expired, process votes
        if (game.phase === "voting" && game.votingEndsAt && Date.now() >= game.votingEndsAt) {
          await processVoteResults(game.id);
          const updatedGame = await getGameById(game.id);
          if (updatedGame) {
            game.phase = updatedGame.phase;
            (game as any).result = updatedGame.result;
            (game as any).round = updatedGame.round;
            (game as any).vampireKillId = updatedGame.vampireKillId;
            (game as any).voteEliminatedId = updatedGame.voteEliminatedId;
            (game as any).timerEndsAt = updatedGame.timerEndsAt;
          }
        }

        // Auto-transition: round_end timer expired → start next round or end
        if (game.phase === "round_end" && game.timerEndsAt && Date.now() >= game.timerEndsAt) {
          const aliveNow = allPlayers.filter((p) => p.isAlive);
          if (checkVampireWinCondition(aliveNow)) {
            await updateGame(game.id, { phase: "results", result: "vampire_wins" });
            game.phase = "results";
            (game as any).result = "vampire_wins";
          } else {
            const newRound = (game.round || 1) + 1;
            const timerEndsAt = Date.now() + DISCUSSION_DURATION_MS;
            await resetVotes(game.id);
            // NOTE: keep vampireKillId / voteEliminatedId so the "who was
            // eliminated" message persists through the next discussion phase.
            // They get overwritten at the next round_end.
            await updateGame(game.id, {
              phase: "playing",
              timerEndsAt,
              round: newRound,
            });
            game.phase = "playing";
            (game as any).timerEndsAt = timerEndsAt;
            (game as any).round = newRound;
          }
        }

        // Build player view
        const publicPlayers = allPlayers.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          isAlive: p.isAlive,
          isHost: p.isHost,
          hasVoted: p.votedForId !== null,
          isDetained: p.detainedUntil ? Date.now() < p.detainedUntil : false,
          isVoteBlocked: p.voteBlocked,
          isInitiateBlocked: p.initiateBlocked,
          // Only reveal roles in results phase
          role: game.phase === "results" ? p.role : undefined,
        }));

        // Get vampire kill and vote eliminated info for round_end display
        // AND during the following discussion ("playing") so the elimination
        // announcement stays visible into the next round.
        let vampireKill = null;
        let voteEliminated = null;
        if (game.phase === "round_end" || game.phase === "results" || game.phase === "playing") {
          if ((game as any).vampireKillId) {
            const killed = allPlayers.find((p) => p.id === (game as any).vampireKillId);
            if (killed) {
              vampireKill = { id: killed.id, displayName: killed.displayName, role: killed.role as Role };
            }
          }
          if ((game as any).voteEliminatedId) {
            const eliminated = allPlayers.find((p) => p.id === (game as any).voteEliminatedId);
            if (eliminated) {
              voteEliminated = { id: eliminated.id, displayName: eliminated.displayName, role: eliminated.role as Role };
            }
          }
        }

        // Get current player's ability usage for this game
        let abilityUsed: { ability: string; round: number; result: string | null }[] = [];
        if (player) {
          const usages = await getAbilityUsages(input.gameId, player.id);
          abilityUsed = usages.map((u) => ({ ability: u.ability, round: u.round, result: u.result }));
        }

        return {
          game: {
            id: game.id,
            code: game.code,
            hostUserId: game.hostUserId,
            phase: game.phase,
            result: (game as any).result ?? game.result,
            round: (game as any).round ?? game.round,
            timerEndsAt: (game as any).timerEndsAt ?? game.timerEndsAt,
            votingEndsAt: (game as any).votingEndsAt ?? game.votingEndsAt,
          },
          players: publicPlayers,
          currentPlayer: player
            ? {
                id: player.id,
                displayName: player.displayName,
                role: player.role as Role | null,
                isAlive: player.isAlive,
                isHost: player.isHost,
                votedForId: player.votedForId,
                isDetained: player.detainedUntil ? Date.now() < player.detainedUntil : false,
                voteBlocked: player.voteBlocked,
                abilityBlockedUntil: player.abilityBlockedUntil,
              }
            : null,
          vampireKill,
          voteEliminated,
          abilityUsed,
        };
      }),

    // ─── Cast a vote (secret — Dumb Cheerleader/Dumb Jock CANNOT vote) ─────
    vote: publicProcedure
      .input(z.object({ gameId: z.number(), targetPlayerId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        if (!player) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not in game" });

        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND" });
        if (game.phase !== "voting")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not in voting phase" });

        if (!player.isAlive)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Eliminated players cannot vote" });

        // Dumb Cheerleader and Dumb Jock cannot vote at all
        if (NON_VOTING_ROLES.includes(player.role as Role))
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your role cannot vote" });

        // Check if vote-blocked by Dumb Jock intimidate
        if (player.voteBlocked)
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have been intimidated and cannot vote this round" });

        if (player.votedForId !== null)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Already voted" });

        // Validate target
        const target = await getPlayerById(input.targetPlayerId);
        if (!target || target.gameId !== game.id || !target.isAlive)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });

        if (target.id === player.id)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot vote for yourself" });

        await castVote(player.id, input.targetPlayerId);

        // Check if all eligible alive players have voted
        const allPlayers = await getPlayersByGameId(game.id);
        const eligibleVoters = allPlayers.filter((p) =>
          p.isAlive &&
          !NON_VOTING_ROLES.includes(p.role as Role) &&
          !p.voteBlocked
        );
        const allVoted = eligibleVoters.every((p) => {
          if (p.id === player.id) return true;
          return p.votedForId !== null;
        });

        if (allVoted) {
          await processVoteResults(game.id);
        }

        return { success: true };
      }),

    // ─── Use Ability ────────────────────────────────────────────────
    useAbility: publicProcedure
      .input(
        z.object({
          gameId: z.number(),
          abilityName: z.string(),
          targetPlayerId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        if (!player) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not in game" });
        if (!player.isAlive)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Dead players cannot use abilities" });

        const game = await getGameById(input.gameId);
        if (!game) throw new TRPCError({ code: "NOT_FOUND" });
        if (game.phase !== "playing")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Abilities can only be used during discussion" });

        const role = player.role as Role;
        const abilityName = input.abilityName as AbilityName;

        // Validate ability: Vampire can use any ability (except kill abilities), others can only use their own
        if (role !== "Vampire") {
          const playerAbility = ROLE_TO_ABILITY[role];
          if (abilityName !== playerAbility) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot use this ability" });
          }
        } else {
          // Vampire cannot use kill/elimination abilities
          if (VAMPIRE_BLOCKED_ABILITIES.includes(abilityName)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "The Vampire cannot use elimination abilities" });
          }
        }

        // Validate ability name exists
        if (!(abilityName in ABILITY_LIMITS)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid ability" });
        }

        // Check if already used
        const alreadyUsed = await hasAbilityBeenUsed(game.id, player.id, abilityName, game.round, role);
        if (alreadyUsed)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ability already used" });

        // Check detained
        if (player.detainedUntil && Date.now() < player.detainedUntil)
          throw new TRPCError({ code: "BAD_REQUEST", message: "You are detained and cannot use abilities" });

        // Check if ability is blocked (Principal's administrative leave)
        if (player.abilityBlockedUntil && Date.now() < player.abilityBlockedUntil)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your ability has been blocked by administrative leave" });

        const allPlayers = await getPlayersByGameId(game.id);
        let resultData: any = null;

        switch (abilityName) {
          case "homecoming_fastforward": {
            // Fast-forward discussion to voting phase immediately
            if (game.phase !== "playing")
              throw new TRPCError({ code: "BAD_REQUEST", message: "Can only fast-forward during discussion" });

            const now = Date.now();
            await updateGame(game.id, {
              phase: "voting",
              votingEndsAt: now + VOTING_DURATION_MS,
              timerEndsAt: null,
            });
            resultData = { fastForwarded: true };
            break;
          }

          case "bully_spotlight": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            // Silence everyone for 30 seconds, spotlight the target to give their case
            const silenceEndsAt = Date.now() + 30000;
            // Detain all players except the target for 30s (they must shut up)
            for (const p of allPlayers.filter((pp) => pp.isAlive && pp.id !== target.id)) {
              await setPlayerDetained(p.id, silenceEndsAt);
            }
            resultData = { targetName: target.displayName, silenceEndsAt };
            break;
          }

          case "gossip_queen_destroy": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            // Kill target and self (Gossip Queen destroys reputation but is also done)
            await eliminatePlayer(target.id);
            await eliminatePlayer(player.id);

            const targetWasVampire = target.role === "Vampire";
            resultData = { targetName: target.displayName, gossipQueenAlsoOut: true };

            // Record usage before checking win condition
            await recordAbilityUsage({
              gameId: game.id,
              playerId: player.id,
              ability: abilityName,
              targetPlayerId: target.id,
              round: game.round,
              result: JSON.stringify(resultData),
            });

            if (targetWasVampire) {
              // High school wins!
              await updateGame(game.id, { phase: "results", result: "highschool_wins" });
              return { success: true, result: resultData };
            }

            // Check if vampire wins after gossip queen is out
            const aliveAfter = allPlayers.filter((p) =>
              p.id !== target.id && p.id !== player.id && p.isAlive
            );
            if (checkVampireWinCondition(aliveAfter)) {
              await updateGame(game.id, { phase: "results", result: "vampire_wins" });
            }

            return { success: true, result: resultData };
          }

          case "mathlete_view": {
            const usedRoles = allPlayers.map((p) => p.role).filter(Boolean) as Role[];
            const unusedRoles = NON_VAMPIRE_ROLES.filter((r) => !usedRoles.includes(r));
            resultData = { unusedRoles };
            break;
          }

          case "teacher_detain": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            const detainedUntil = Date.now() + DETENTION_DURATION_MS;
            await setPlayerDetained(target.id, detainedUntil);
            resultData = { targetName: target.displayName, detainedUntil };
            break;
          }

          case "cheerleader_peek": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            resultData = { targetName: target.displayName, role: target.role };
            break;
          }

          case "dumb_jock_intimidate": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            await setPlayerVoteBlocked(target.id, true);
            resultData = { targetName: target.displayName };
            break;
          }

          case "school_counselor_pull": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            const pulledUntil = Date.now() + DETENTION_DURATION_MS;
            // Both the counselor and target are pulled away
            await setPlayerDetained(target.id, pulledUntil);
            await setPlayerDetained(player.id, pulledUntil);
            resultData = { targetName: target.displayName, pulledUntil };
            break;
          }

          case "principal_administrative_leave": {
            if (!input.targetPlayerId)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Must select a target" });
            const target = allPlayers.find((p) => p.id === input.targetPlayerId && p.isAlive);
            if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid target" });
            if (target.id === player.id)
              throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot target yourself" });

            // Block ability for the rest of this round (until next round starts)
            // Use a marker that will be cleared when resetVotes is called at round start
            const abilityBlockedUntil = Date.now() + DISCUSSION_DURATION_MS + VOTING_DURATION_MS + ROUND_END_DURATION_MS;
            await setPlayerAbilityBlocked(target.id, abilityBlockedUntil);
            resultData = { targetName: target.displayName, abilityBlockedUntil };
            break;
          }

          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown ability" });
        }

        // Record usage (gossip_queen already recorded above and returned early)
        await recordAbilityUsage({
          gameId: game.id,
          playerId: player.id,
          ability: abilityName,
          targetPlayerId: input.targetPlayerId ?? null,
          round: game.round,
          result: resultData ? JSON.stringify(resultData) : null,
        });

        return { success: true, result: resultData };
      }),

    // ─── Get unused roles (for Mathlete ability) ────────────────────
    unusedRoles: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input, ctx }) => {
        const player = await getPlayerFromRequest(ctx.req);
        if (!player) throw new TRPCError({ code: "UNAUTHORIZED" });

        if (player.role !== "Mathlete")
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the Mathlete can use this" });

        const allPlayers = await getPlayersByGameId(input.gameId);
        const usedRoles = allPlayers.map((p) => p.role).filter(Boolean) as Role[];
        const unused = NON_VAMPIRE_ROLES.filter((r) => !usedRoles.includes(r));
        return { unusedRoles: unused };
      }),
  }),
});

/**
 * Process vote results at end of voting phase.
 * UNANIMITY RULE: All non-vampire eligible voters must vote for the SAME person to eliminate them.
 * - Dumb Cheerleader and Dumb Jock do NOT vote
 * - Vote-blocked players do NOT vote
 * - The Vampire's vote does NOT count toward the unanimity check
 * - If all non-vampire eligible voters are unanimous → that player is eliminated
 * - If eliminated player is Vampire → high school wins
 * - If NOT unanimous → Vampire's vote target is killed instead
 * - Check if vampire wins (only 2 players left)
 */
async function processVoteResults(gameId: number) {
  const allPlayers = await getPlayersByGameId(gameId);
  const alivePlayers = allPlayers.filter((p) => p.isAlive);
  const game = await getGameById(gameId);
  if (!game) return;

  // Collect votes from non-vampire eligible voters only
  // (not Dumb Cheerleader/Dumb Jock, not vote-blocked, not the Vampire)
  const nonVampireVotes: number[] = [];

  for (const p of alivePlayers) {
    if (p.role === "Vampire") continue; // Vampire's vote doesn't count for unanimity
    if (NON_VOTING_ROLES.includes(p.role as Role)) continue; // Can't vote
    if (p.voteBlocked) continue; // Intimidated this round
    if (p.votedForId !== null) {
      nonVampireVotes.push(p.votedForId);
    }
  }

  // Check unanimity: all non-vampire voters must agree on the same target
  const isUnanimous = nonVampireVotes.length > 0 && nonVampireVotes.every((v) => v === nonVampireVotes[0]);
  const unanimousTarget = isUnanimous ? nonVampireVotes[0] : null;

  let voteEliminatedId: number | null = null;

  if (unanimousTarget) {
    // Unanimous! Eliminate the target
    await eliminatePlayer(unanimousTarget);
    voteEliminatedId = unanimousTarget;

    const eliminated = allPlayers.find((p) => p.id === unanimousTarget);
    if (eliminated?.role === "Vampire") {
      await updateGame(gameId, {
        phase: "results",
        result: "highschool_wins",
        voteEliminatedId: unanimousTarget,
        vampireKillId: null,
      });
      return;
    }
  }

  // Not unanimous OR vampire survived — Vampire's vote target is killed
  const vampire = alivePlayers.find((p) => p.role === "Vampire");
  let vampireKillId: number | null = null;

  if (vampire && vampire.votedForId !== null) {
    // Don't kill someone who was already eliminated by unanimous vote
    if (vampire.votedForId !== voteEliminatedId) {
      const vampireTarget = allPlayers.find((p) => p.id === vampire.votedForId && p.isAlive);
      if (vampireTarget) {
        await eliminatePlayer(vampire.votedForId);
        vampireKillId = vampire.votedForId;
      }
    }
  }

  // Check alive players after all eliminations
  const stillAlive = allPlayers.filter((p) => {
    if (p.id === voteEliminatedId) return false;
    if (p.id === vampireKillId) return false;
    return p.isAlive;
  });

  if (checkVampireWinCondition(stillAlive)) {
    await updateGame(gameId, {
      phase: "results",
      result: "vampire_wins",
      voteEliminatedId,
      vampireKillId,
    });
    return;
  }

  // Go to round_end phase to show results before next round
  const roundEndTimer = Date.now() + ROUND_END_DURATION_MS;
  await updateGame(gameId, {
    phase: "round_end",
    timerEndsAt: roundEndTimer,
    voteEliminatedId,
    vampireKillId,
  });
}

export type AppRouter = typeof appRouter;
