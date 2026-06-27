import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://hbqwsanncmfvbnvnwxgm.supabase.co";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_uHaV-A4k6-jpvXNeWtOZBA_vwZQt1dz";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export const getServiceRoleClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Cache of authenticated clients keyed by token — prevents creating a new
// Supabase client per request, which leaks connections over time.
const authedClients = new Map<string, SupabaseClient>();
const CLIENT_TTL = 1000 * 60 * 15; // 15 minutes
const clientTimestamps = new Map<string, number>();

// Periodic cleanup of stale clients (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [token, ts] of clientTimestamps) {
        if (now - ts > CLIENT_TTL) {
          authedClients.delete(token);
          clientTimestamps.delete(token);
        }
      }
    },
    1000 * 60 * 10,
  ).unref();
}

export const getSupabaseClient = (token?: string): SupabaseClient => {
  if (!token) return supabase;

  const cached = authedClients.get(token);
  if (cached) {
    clientTimestamps.set(token, Date.now());
    return cached;
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  authedClients.set(token, client);
  clientTimestamps.set(token, Date.now());
  return client;
};
