"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
}
