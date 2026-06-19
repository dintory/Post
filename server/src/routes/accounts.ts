import { Router } from "express";
import { getSupabaseClient } from "../config/supabase";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Get all accounts for the authenticated user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const { data, error } = await supabase
      .from("youtube_accounts")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ accounts: data || [] });
  } catch (err: any) {
    console.error("[Accounts] Fetch error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Add a new account
router.post("/", requireAuth, async (req: any, res) => {
  const { email, channelName } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const supabase = getSupabaseClient(req.token);

    const { data, error } = await supabase
      .from("youtube_accounts")
      .insert([
        {
          user_id: req.user.id,
          email,
          channel_name: channelName || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ account: data });
  } catch (err: any) {
    console.error("[Accounts] Create error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Sync / refresh an account
router.post("/:id/sync", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseClient(req.token);

    // Verify ownership
    const { data: account, error: fetchErr } = await supabase
      .from("youtube_accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (fetchErr || !account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // TODO: Real YouTube API sync. For now, just update the timestamp.
    const { data, error } = await supabase
      .from("youtube_accounts")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ account: data, synced: true });
  } catch (err: any) {
    console.error("[Accounts] Sync error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete an account
router.delete("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const supabase = getSupabaseClient(req.token);

    const { error } = await supabase
      .from("youtube_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[Accounts] Delete error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
