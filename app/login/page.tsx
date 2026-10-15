"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setMessage("Sign-in is not connected yet. The site administrator must configure Supabase before accounts can work.");
      setBusy(false);
      return;
    }
    try {
      const supabase = createBrowserClient(url, key);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      window.location.href = safeNext;
    } catch {
      setMessage("We could not reach the account service. Please try again.");
      setBusy(false);
    }
  }

  return <section className="page-content"><form className="form-card" onSubmit={submit}>
    <div className="eyebrow">ACCOUNT ACCESS</div><h1 style={{ fontSize: 36 }}>Sign in</h1>
    <p className="muted">Sign in to retrieve your saved research briefs and manage your account.</p>
    <label className="form-field" style={{ marginTop: 18 }}>Email<input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
    <label className="form-field" style={{ marginTop: 16 }}>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
    <button className="btn-primary" disabled={busy} style={{ marginTop: 20 }}>{busy ? "Signing in…" : "Sign in"}</button>
    {message && <p role="alert" className="notice" style={{ marginTop: 15 }}>{message}</p>}
    <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>New to ResearchHub? <Link className="text-link" href="/signup">Create an account</Link></p>
  </form></section>;
}
