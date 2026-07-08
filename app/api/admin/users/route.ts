import { NextRequest, NextResponse } from "next/server";
import { authed } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export const runtime = "nodejs";

type MicroappRow = Database["public"]["Tables"]["dx3xb_microapps"]["Row"];
type ProfileRow = Database["public"]["Tables"]["dx3xb_profiles"]["Row"];
type RunRow = Database["public"]["Tables"]["dx3xb_runs"]["Row"];

type AdminUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  handle: string | null;
  runCount: number;
  appCount: number;
  publicAppCount: number;
  pendingAppCount: number;
  totalPlays: number;
  reportCount: number;
  apps: Array<{
    id: string;
    slug: string;
    title: string;
    template: string;
    status: string;
    plays: number;
    reports: number;
    created_at: string | null;
    updated_at: string | null;
  }>;
};

function inc(map: Map<string, number>, key: string | null | undefined) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const supabase = getServiceClient();

    const users = [];
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const [{ data: profiles, error: profileError }, { data: apps, error: appsError }, { data: runs, error: runsError }, { data: reports, error: reportsError }] =
      await Promise.all([
        supabase.from("dx3xb_profiles").select("user_id, handle, created_at").limit(5000),
        supabase.from("dx3xb_microapps").select("id, owner_id, slug, title, template, status, plays, created_at, updated_at").order("updated_at", { ascending: false }).limit(5000),
        supabase.from("dx3xb_runs").select("user_id").limit(10000),
        supabase.from("dx3xb_microapp_reports").select("microapp_id").limit(10000),
      ]);

    if (profileError) throw profileError;
    if (appsError) throw appsError;
    if (runsError) throw runsError;
    if (reportsError) throw reportsError;

    const profileByUser = new Map((profiles ?? []).map((p: ProfileRow) => [p.user_id, p]));
    const runCounts = new Map<string, number>();
    for (const run of (runs ?? []) as Pick<RunRow, "user_id">[]) inc(runCounts, run.user_id);

    const reportCountsByApp = new Map<string, number>();
    for (const report of reports ?? []) inc(reportCountsByApp, report.microapp_id);

    const appsByUser = new Map<string, MicroappRow[]>();
    for (const app of (apps ?? []) as MicroappRow[]) {
      const list = appsByUser.get(app.owner_id) ?? [];
      list.push(app);
      appsByUser.set(app.owner_id, list);
    }

    const userIds = new Set<string>();
    for (const user of users) userIds.add(user.id);
    for (const id of profileByUser.keys()) userIds.add(id);
    for (const id of appsByUser.keys()) userIds.add(id);
    for (const id of runCounts.keys()) userIds.add(id);

    const authById = new Map(users.map((u) => [u.id, u]));
    const out: AdminUser[] = Array.from(userIds).map((id) => {
      const authUser = authById.get(id);
      const profile = profileByUser.get(id);
      const userApps = appsByUser.get(id) ?? [];
      const appSummaries = userApps.map((app) => ({
        id: app.id,
        slug: app.slug,
        title: app.title,
        template: app.template,
        status: app.status,
        plays: app.plays,
        reports: reportCountsByApp.get(app.id) ?? 0,
        created_at: app.created_at,
        updated_at: app.updated_at,
      }));
      return {
        id,
        email: authUser?.email ?? null,
        isAnonymous: !!authUser?.is_anonymous,
        createdAt: authUser?.created_at ?? profile?.created_at ?? userApps[0]?.created_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        handle: profile?.handle ?? null,
        runCount: runCounts.get(id) ?? 0,
        appCount: userApps.length,
        publicAppCount: userApps.filter((app) => app.status === "public").length,
        pendingAppCount: userApps.filter((app) => app.status === "pending").length,
        totalPlays: userApps.reduce((sum, app) => sum + app.plays, 0),
        reportCount: appSummaries.reduce((sum, app) => sum + app.reports, 0),
        apps: appSummaries,
      };
    });

    out.sort((a, b) => {
      const bp = b.totalPlays + b.appCount * 10 + b.runCount;
      const ap = a.totalPlays + a.appCount * 10 + a.runCount;
      if (bp !== ap) return bp - ap;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });

    return NextResponse.json({
      ok: true,
      users: out,
      summary: {
        users: out.length,
        claimed: out.filter((u) => !u.isAnonymous && u.email).length,
        anonymous: out.filter((u) => u.isAnonymous).length,
        apps: (apps ?? []).length,
        publicApps: (apps ?? []).filter((app) => app.status === "public").length,
        totalPlays: (apps ?? []).reduce((sum, app) => sum + app.plays, 0),
        reports: (reports ?? []).length,
      },
    });
  } catch (e) {
    console.error("admin users read", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
