import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function microappsRepository(db: SupabaseClient<Database>) {
  return {
    async playableBySlug(slug: string) {
      const { data, error } = await db.from("dx3xb_microapps").select("id,slug,title,owner_id,status").eq("slug", slug).in("status", ["unlisted", "pending", "public"]).maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}
