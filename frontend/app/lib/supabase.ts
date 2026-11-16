import { createClient } from "@supabase/supabase-js";

// publishable キーのみ。secret / service_role は置かない。
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
);
