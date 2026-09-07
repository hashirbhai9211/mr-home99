import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { initDb } from "@/db";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a route handler with safe error handling (no stack traces leak). */
export function handle<Ctx = unknown>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      await initDb(); // lazy DB init: first access applies schema (PGlite) / connects (PG)
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
        return NextResponse.json({ error: "Validation failed", issues }, { status: 400 });
      }
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      const pgErr = err as { code?: string; constraint?: string };
      if (pgErr?.code === "23505") {
        return NextResponse.json({ error: "A record with this unique value already exists (e.g. slug or email)." }, { status: 409 });
      }
      console.error("[api]", err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export function parseIntParam(v: string | undefined, fallback: number, max = 100) {
  const n = parseInt(v ?? "", 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
}
