import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Demo UI can render without credentials. Add Supabase credentials before enabling real data.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
