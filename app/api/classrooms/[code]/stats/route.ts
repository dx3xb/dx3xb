import { NextRequest, NextResponse } from "next/server";
import { CLASSROOM_GAME_KEYS, safeClassCode } from "@/lib/ai-classrooms";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function bearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = safeClassCode(rawCode);
  if (!code) return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  try {
    const token = bearer(req);
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const db = getServiceClient() as any;
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user || auth.user.is_anonymous) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const { data: room, error: roomError } = await db.from("dx3xb_classrooms").select("id,owner_id,code,title,pack,status,expires_at,created_at").eq("code", code).maybeSingle();
    if (roomError) throw roomError;
    if (!room || room.owner_id !== auth.user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const { data: runs, error: runsError } = await db.from("dx3xb_runs").select("user_id,game,pct,created_at").contains("stats", { classCode: code }).in("game", [...CLASSROOM_GAME_KEYS]).order("created_at", { ascending: false }).limit(5000);
    if (runsError) throw runsError;
    const rows = (runs || []) as { user_id: string; game: string; pct: number; created_at: string }[];
    const players = new Set(rows.map((row) => row.user_id)).size;
    const games = CLASSROOM_GAME_KEYS.map((game) => {
      const gameRows = rows.filter((row) => row.game === game);
      return {
        game,
        completions: gameRows.length,
        players: new Set(gameRows.map((row) => row.user_id)).size,
        averageMastery: gameRows.length ? Math.round(gameRows.reduce((sum, row) => sum + (Number(row.pct) || 0), 0) / gameRows.length) : 0,
      };
    });
    return NextResponse.json({ ok: true, classroom: { code: room.code, title: room.title, pack: room.pack, status: room.status, expiresAt: room.expires_at }, summary: { players, completions: rows.length, games } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("classroom stats failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

