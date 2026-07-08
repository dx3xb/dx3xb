import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// 仅服务端使用：用 service_role 密钥，绕过 RLS，安全地读写。
// 这些值只在 Vercel 服务端环境变量里，永不暴露给浏览器。
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 单例：Vercel serverless 每个实例复用同一个 client，避免重复创建开销。
let _client: SupabaseClient<Database> | null = null;

export function getServiceClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
