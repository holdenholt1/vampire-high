import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, games, players, abilityUsages, type Game, type Player, type AbilityUsage } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";
import type { Role, AbilityName } from "../shared/types";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Game Helpers ───────────────────────────────────────────────────

function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createGame(hostUserId: number | null): Promise<Game> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGameCode();
    try {
      const [result] = await db.insert(games).values({ code, hostUserId });
      const insertId = result.insertId;
      const [game] = await db.select().from(games).where(eq(games.id, insertId)).limit(1);
      return game;
    } catch (e: any) {
      if (e?.code === "ER_DUP_ENTRY" && attempt < 4) continue;
      throw e;
    }
  }
  throw new Error("Could not generate unique game code");
}

export async function getGameByCode(code: string): Promise<Game | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [game] = await db.select().from(games).where(eq(games.code, code.toUpperCase())).limit(1);
  return game;
}

export async function getGameById(id: number): Promise<Game | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [game] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return game;
}

export async function updateGame(id: number, data: Partial<Pick<Game, "phase" | "result" | "timerEndsAt" | "votingEndsAt" | "round" | "vampireKillId" | "voteEliminatedId">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(games).set(data).where(eq(games.id, id));
}

// ─── Player Helpers ─────────────────────────────────────────────────

export async function addPlayer(gameId: number, displayName: string, userId: number | null, isHost: boolean): Promise<Player> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sessionToken = nanoid(32);
  const [result] = await db.insert(players).values({ gameId, displayName, userId, sessionToken, isHost });
  const [player] = await db.select().from(players).where(eq(players.id, result.insertId)).limit(1);
  return player;
}

export async function getPlayersByGameId(gameId: number): Promise<Player[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).where(eq(players.gameId, gameId));
}

export async function getPlayerByToken(sessionToken: string): Promise<Player | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [player] = await db.select().from(players).where(eq(players.sessionToken, sessionToken)).limit(1);
  return player;
}

export async function getPlayerById(id: number): Promise<Player | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return player;
}

export async function assignRoles(gameId: number, roleAssignments: { playerId: number; role: Role }[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const { playerId, role } of roleAssignments) {
    await db.update(players).set({ role }).where(eq(players.id, playerId));
  }
}

export async function castVote(playerId: number, targetId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ votedForId: targetId }).where(eq(players.id, playerId));
}

export async function eliminatePlayer(playerId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ isAlive: false }).where(eq(players.id, playerId));
}

export async function resetVotes(gameId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ votedForId: null, voteBlocked: false, initiateBlocked: false, detainedUntil: null, abilityBlockedUntil: null }).where(eq(players.gameId, gameId));
}

export async function getVoteTally(gameId: number): Promise<{ votedForId: number; count: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      votedForId: players.votedForId,
      count: sql<number>`COUNT(*)`,
    })
    .from(players)
    .where(and(eq(players.gameId, gameId), sql`${players.votedForId} IS NOT NULL`))
    .groupBy(players.votedForId);
  return result.map((r) => ({ votedForId: r.votedForId!, count: Number(r.count) }));
}

// ─── Player Status Helpers ──────────────────────────────────────────

export async function setPlayerDetained(playerId: number, detainedUntil: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ detainedUntil }).where(eq(players.id, playerId));
}

export async function setPlayerVoteBlocked(playerId: number, blocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ voteBlocked: blocked }).where(eq(players.id, playerId));
}

export async function setPlayerInitiateBlocked(playerId: number, blocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ initiateBlocked: blocked }).where(eq(players.id, playerId));
}

export async function setPlayerAbilityBlocked(playerId: number, abilityBlockedUntil: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set({ abilityBlockedUntil }).where(eq(players.id, playerId));
}

// ─── Ability Usage Helpers ──────────────────────────────────────────

export async function recordAbilityUsage(data: {
  gameId: number;
  playerId: number;
  ability: AbilityName;
  targetPlayerId: number | null;
  round: number;
  result: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(abilityUsages).values(data);
}

export async function getAbilityUsages(gameId: number, playerId: number): Promise<AbilityUsage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(abilityUsages).where(
    and(eq(abilityUsages.gameId, gameId), eq(abilityUsages.playerId, playerId))
  );
}

export async function getAbilityUsagesForRound(gameId: number, playerId: number, round: number): Promise<AbilityUsage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(abilityUsages).where(
    and(
      eq(abilityUsages.gameId, gameId),
      eq(abilityUsages.playerId, playerId),
      eq(abilityUsages.round, round)
    )
  );
}

export async function getAllAbilityUsagesForGame(gameId: number): Promise<AbilityUsage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(abilityUsages).where(eq(abilityUsages.gameId, gameId));
}
