// Fail loudly at startup rather than with a confusing 401 later.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_KEY = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
