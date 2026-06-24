import { createClient } from "@supabase/supabase-js";

// 仅服务端使用：用 service_role 密钥，绕过 RLS，安全地读写。
// 这些值只在 Vercel 服务端环境变量里，永不暴露给浏览器。
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
