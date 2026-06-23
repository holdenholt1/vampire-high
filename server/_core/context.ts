import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Guest-only deployment: there is no OAuth/login. We never resolve a platform
 * user. Per-player identity is handled entirely by the `x-player-token` header
 * (see getPlayerFromRequest in routers.ts), so `user` is always null here.
 *
 * (Originally this called sdk.authenticateRequest(req) against Manus OAuth.)
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: null,
  };
}
