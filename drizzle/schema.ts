import {
  bigint,
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ───────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Games ──────────────────────────────────────────────────────────
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  hostUserId: int("hostUserId"),
  phase: mysqlEnum("phase", ["lobby", "playing", "voting", "round_end", "results"])
    .default("lobby")
    .notNull(),
  result: mysqlEnum("result", ["vampire_wins", "highschool_wins"]),
  round: int("round").default(1).notNull(),
  timerEndsAt: bigint("timerEndsAt", { mode: "number" }),
  votingEndsAt: bigint("votingEndsAt", { mode: "number" }),
  /** Player ID killed by vampire at end of round (shown during round_end) */
  vampireKillId: int("vampireKillId"),
  /** Player ID eliminated by vote (shown during round_end) */
  voteEliminatedId: int("voteEliminatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

// ─── Players ────────────────────────────────────────────────────────
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  userId: int("userId"),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 32 }).notNull(),
  role: varchar("role", { length: 32 }),
  isAlive: boolean("isAlive").default(true).notNull(),
  isHost: boolean("isHost").default(false).notNull(),
  votedForId: int("votedForId"),
  /** Timestamp when detention ends (Teacher/Counselor ability) */
  detainedUntil: bigint("detainedUntil", { mode: "number" }),
  /** If true, this player cannot vote this round (Dumb Jock intimidate) */
  voteBlocked: boolean("voteBlocked").default(false).notNull(),
  /** If true, this player cannot initiate a vote this round (Bully block) */
  initiateBlocked: boolean("initiateBlocked").default(false).notNull(),
  /** Timestamp when ability block ends (Principal administrative leave) */
  abilityBlockedUntil: bigint("abilityBlockedUntil", { mode: "number" }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

// ─── Ability Usages ────────────────────────────────────────────────
export const abilityUsages = mysqlTable("ability_usages", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  playerId: int("playerId").notNull(),
  ability: varchar("ability", { length: 32 }).notNull(),
  targetPlayerId: int("targetPlayerId"),
  round: int("round").notNull(),
  result: text("result"), // JSON string
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export type AbilityUsage = typeof abilityUsages.$inferSelect;
export type InsertAbilityUsage = typeof abilityUsages.$inferInsert;
