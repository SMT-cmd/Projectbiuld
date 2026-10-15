"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError("Sign-out is unavailable because account configuration is missing.");
      setBusy(false);
      return;
    }
    try {
      const supabase = createBrowserClient(url, key);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.href = "/";
    } catch {
      setError("We could not sign you out. Please try again.");
      setBusy(false);
    }
  }

  return <div>
    <button type="button" className="btn-secondary" onClick={signOut} disabled={busy}>
      <LogOut size={16} /> {busy ? "Signing out…" : "Sign out"}
    </button>
    {error && <p role="alert" className="notice" style={{ marginTop: 10 }}>{error}</p>}
  </div>;
}
