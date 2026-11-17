import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { INITIAL_COUNTRIES } from "@/lib/gameEngine";
import { RuleError } from "@/lib/rules";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  execute,
  initialState,
  reconcile,
  type State,
  type Command,
} from "@/lib/classroom";
import type { Prisma } from "@/generated/classroom/client";
export const runtime = "nodejs";
const json = (v: unknown) =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const code = () => randomBytes(9).toString("base64url").toUpperCase();
const requestSchema = z.object({
  op: z.enum([
    "me",
    "list",
    "create",
    "join",
    "recover",
    "state",
    "command",
    "rotate",
    "revoke",
    "remove",
    "delete",
    "export",
  ]),
  room: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,20}$/)
    .optional(),
  title: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(60).optional(),
  country: z.enum(INITIAL_COUNTRIES.map((c) => c.name_en)).optional(),
  code: z.string().max(40).optional(),
  rounds: z.number().int().min(1).max(12).optional(),
  duration: z.number().int().min(60).max(900).optional(),
  requestId: z.string().uuid().optional(),
  command: z
    .object({
      type: z.enum([
        "SYNC",
        "START",
        "CLOSE",
        "PAUSE",
        "RESUME",
        "LOCK",
        "ADJUST",
        "ARCHIVE",
        "ORDER",
        "PROPOSE",
        "ACCEPT",
        "DECLINE",
        "CANCEL",
      ]),
      action: z.string().max(30).optional(),
      target: z.string().max(40).optional(),
      proposalId: z.string().max(100).optional(),
      resource: z.string().max(10).optional(),
      delta: z.number().int().min(-15).max(15).optional(),
      reason: z.string().trim().max(300).optional(),
      round: z.number().int().optional(),
    })
    .optional(),
});
type Tx = Prisma.TransactionClient;
async function save(tx: Tx, id: string, previous: State, s: State) {
  await tx.game.update({
    where: { id },
    data: { state: json(s), version: { increment: 1 } },
  });
  for (const event of s.events.slice(previous.events.length))
    await tx.gameEvent.create({
      data: {
        gameId: id,
        sequence: event.sequence,
        round: event.round,
        createdAt: new Date(event.at),
        category: event.category,
        message: json(event),
      },
    });
  for (const summary of s.summaries.slice(previous.summaries.length))
    await tx.round.create({
      data: { gameId: id, number: summary.round, summary: json(summary) },
    });
  await tx.alliance.deleteMany({ where: { gameId: id } });
  if (s.alliances.length)
    await tx.alliance.createMany({
      data: s.alliances.map(([countryA, countryB]) => ({
        gameId: id,
        countryA,
        countryB,
      })),
    });
  for (const p of s.proposals.filter(
    (p) =>
      !previous.proposals.some(
        (old) => old.id === p.id && old.status === p.status,
      ),
  ))
    await tx.proposal.upsert({
      where: { id: id + p.id },
      create: {
        id: id + p.id,
        gameId: id,
        sender: p.from,
        recipient: p.to,
        kind: p.kind,
        round: p.round,
        status: p.status,
      },
      update: { status: p.status },
    });
}
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    const data = requestSchema.parse(await req.json());
    const jar = await cookies();
    const login = await auth.api.getSession({ headers: req.headers });
    const teacherId = login?.user.id;
    if (data.op === "me")
      return NextResponse.json({
        teacher: login
          ? { name: login.user.name, email: login.user.email }
          : null,
      });
    if (data.op === "list") {
      if (!teacherId) throw new Error("Teacher login required");
      const games = await db.game.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
        select: { roomCode: true, title: true, state: true },
      });
      return NextResponse.json({
        games: games.map((g) => ({
          room: g.roomCode,
          title: g.title,
          phase: (g.state as unknown as State).phase,
        })),
      });
    }
    if (data.op === "create") {
      if (!teacherId) throw new Error("Teacher login required");
      const room = data.room ?? randomBytes(4).toString("hex").toUpperCase();
      await db.game.create({
        data: {
          roomCode: room,
          title: data.title ?? "1937 Classroom",
          teacherId,
          state: json(initialState(data.rounds, data.duration)),
        },
      });
      return NextResponse.json({ room });
    }
    if (!data.room) throw new Error("Room code required");
    const room = data.room;
    if (["join", "recover"].includes(data.op)) {
      const rateKey = hash(
        "join:" +
          req.headers.get("x-forwarded-for")?.split(",")[0] +
          ":" +
          room +
          ":" +
          data.country,
      );
      const bucket = Math.floor(Date.now() / 60000);
      const key = rateKey + ":" + bucket;
      const attempts = await db.rateLimit.upsert({
        where: { key },
        create: { id: key, key, count: 1, lastRequest: BigInt(Date.now()) },
        update: { count: { increment: 1 } },
      });
      if (attempts.count > 15)
        return NextResponse.json(
          { error: "Too many attempts. Wait one minute." },
          { status: 429 },
        );
    }
    const result = await db.$transaction(
      async (tx) => {
        const rows = await tx.$queryRaw<
          { id: string }[]
        >`SELECT id FROM "Game" WHERE "roomCode" = ${room} FOR UPDATE`;
        if (!rows.length)
          throw new Error("Room not found / ルームが見つかりません");
        const game = await tx.game.findUniqueOrThrow({
          where: { id: rows[0].id },
          include: { teams: true },
        });
        const original = game.state as unknown as State;
        const isTeacher = game.teacherId === teacherId;
        if (data.op === "join" || data.op === "recover") {
          let team = game.teams.find((t) => t.country === data.country);
          let recoveryCode: string | undefined;
          if (data.op === "join") {
            if (original.locked || original.phase !== "LOBBY")
              throw new Error("Room is closed to new teams");
            if (!original.countries.some((c) => c.name === data.country))
              throw new Error("Invalid country");
            if (team)
              throw new Error(
                "Country already claimed. Use its team rejoin code.",
              );
            recoveryCode = code();
            team = await tx.team.create({
              data: {
                gameId: game.id,
                country: data.country!,
                name: data.name ?? data.country!,
                codeHash: hash(recoveryCode),
              },
            });
          } else {
            if (
              !team ||
              !data.code ||
              team.codeHash !== hash(data.code.trim().toUpperCase())
            )
              throw new Error("Incorrect team code");
            if (original.phase === "ARCHIVED") throw new Error("Game archived");
          }
          const token = randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 14 * 86400000);
          await tx.deviceSession.create({
            data: { teamId: team!.id, tokenHash: hash(token), expiresAt },
          });
          return {
            setCookie: {
              name: "team_" + room,
              value: token,
              expires: expiresAt,
            },
            room,
            code: recoveryCode,
          };
        }
        const token = jar.get("team_" + room)?.value;
        const device = token
          ? await tx.deviceSession.findUnique({
              where: { tokenHash: hash(token) },
              include: { team: true },
            })
          : null;
        const actor =
          device &&
          device.expiresAt.getTime() > Date.now() &&
          device.team.gameId === game.id
            ? device.team.country
            : null;
        if (!isTeacher && !actor)
          throw new Error("Join this room or sign in as its teacher");
        if (
          ["rotate", "revoke", "remove", "delete", "export"].includes(data.op)
        ) {
          if (!isTeacher) throw new Error("Teacher access required");
          if (data.op === "delete") {
            if (!["FINISHED", "ARCHIVED", "LOBBY"].includes(original.phase))
              throw new Error("Finish the game first");
            await tx.game.delete({ where: { id: game.id } });
            return { deleted: true };
          }
          if (data.op === "export")
            return {
              export: {
                title: game.title,
                room,
                state: original,
                teams: game.teams.map((t) => ({
                  country: t.country,
                  name: t.name,
                })),
              },
            };
          const team = game.teams.find((t) => t.country === data.country);
          if (!team) throw new Error("Team not found");
          if (data.op === "remove") {
            if (original.phase !== "LOBBY")
              throw new Error("Teams can only be removed before starting");
            await tx.team.delete({ where: { id: team.id } });
            return { success: true };
          }
          await tx.deviceSession.deleteMany({ where: { teamId: team.id } });
          if (data.op === "rotate") {
            const next = code();
            await tx.team.update({
              where: { id: team.id },
              data: { codeHash: hash(next) },
            });
            return { code: next };
          }
          return { success: true };
        }
        let state = reconcile(original, Date.now());
        let commandEvents: State["events"] = [];
        let error: string | undefined;
        let errorCode: string | undefined;
        let errorParams: Record<string, string | number> | undefined;
        if (data.op === "command") {
          if (!data.command || !data.requestId)
            throw new Error("Command and request ID required");
          if (data.command.type !== "SYNC" && data.command.round === undefined)
            throw new Error("Round number required");
          const actorKey = isTeacher ? "teacher:" + teacherId : actor!;
          const fingerprint = hash(JSON.stringify(data.command));
          const previous = await tx.processedCommand.findUnique({
            where: {
              gameId_actor_requestId: {
                gameId: game.id,
                actor: actorKey,
                requestId: data.requestId,
              },
            },
          });
          if (previous) {
            if (previous.fingerprint !== fingerprint)
              throw new Error("Request ID already used for another command");
            return previous.result;
          }
          if (data.command.type === "START" && state.phase === "LOBBY")
            state.countries = state.countries.filter((c) =>
              game.teams.some((t) => t.country === c.name),
            );
          try {
            state = execute(
              state,
              data.command as Command,
              actor,
              isTeacher,
              Date.now(),
              (sides) => randomInt(1, sides + 1),
            );
          } catch (e) {
            error = e instanceof Error ? e.message : "Command failed";
            if (e instanceof RuleError) {
              errorCode = e.code;
              errorParams = e.params;
            }
            state = reconcile(original, Date.now());
          }
          commandEvents = state.events.slice(original.events.length);
          const response = {
            events: commandEvents,
            success: !error,
            ...(error ? { error, errorCode, errorParams } : {}),
            version:
              game.version +
              (JSON.stringify(state) !== JSON.stringify(original) ? 1 : 0),
          };
          await tx.processedCommand.create({
            data: {
              gameId: game.id,
              actor: actorKey,
              requestId: data.requestId,
              fingerprint,
              result: json(response),
            },
          });
        }
        if (JSON.stringify(state) !== JSON.stringify(original))
          await save(tx, game.id, original, state);
        const visibleState = isTeacher
          ? state
          : {
              ...state,
              proposals: state.proposals.filter(
                (p) =>
                  p.status === "ACCEPTED" || p.from === actor || p.to === actor,
              ),
            };
        return {
          room,
          gameId: game.id,
          title: game.title,
          ...(data.op === "command" ? { events: commandEvents } : {}),
          state: visibleState,
          version:
            game.version +
            (JSON.stringify(state) !== JSON.stringify(original) ? 1 : 0),
          serverNow: Date.now(),
          teacher: isTeacher,
          country: actor,
          teams: game.teams.map((t) => ({ country: t.country, name: t.name })),
          ...(error ? { error, errorCode, errorParams } : {}),
        };
      },
      { timeout: 15000, maxWait: 10000 },
    );
    if (
      result &&
      typeof result === "object" &&
      "setCookie" in result &&
      result.setCookie
    ) {
      const c = result.setCookie as {
        name: string;
        value: string;
        expires: Date;
      };
      jar.set(c.name, c.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: c.expires,
        path: "/",
      });
      return NextResponse.json({
        room,
        code: "code" in result ? result.code : undefined,
      });
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const expected = e instanceof Error && e.name === "Error";
    const error = expected
      ? e.message
      : e instanceof z.ZodError
        ? "Invalid request fields / 入力を確認してください"
        : "Service temporarily unavailable / 一時的に利用できません";
    console.error("classroom_request_failed", {
      id: randomBytes(8).toString("hex"),
      kind: e instanceof Error ? e.name : "unknown",
    });
    return NextResponse.json(
      { error },
      { status: expected || e instanceof z.ZodError ? 400 : 503 },
    );
  }
}
