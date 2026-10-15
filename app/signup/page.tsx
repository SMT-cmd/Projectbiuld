"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function SignupPage() {
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setMessage("");
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setError("Account registration is not configured yet. Please try again later."); return; }
    setBusy(true);
    try {
      const supabase = createBrowserClient(url,key);
      const {data,error:authError} = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin + "/login" }
      });
      if (authError) { setError(authError.message); setBusy(false); return; }
      if (data.session) {
        window.location.href = "/account";
        return;
      } else {
        setMessage("Check your email for the confirmation link to finish creating your account. If it does not arrive, check your spam folder.");
      }
    } catch {
      setError("We could not create your account right now. Please try again.");
    }
    setBusy(false);
  }

  return <section className="page-content"><form className="form-card" onSubmit={submit}>
    <div className="eyebrow">JOIN RESEARCHHUB</div>
    <h1 style={{fontSize:36}}>Create your account</h1>
    <p className="muted">Create an account to save your research planning briefs and manage your account. Account access requires the connected Supabase service.</p>
    <label className="form-field" style={{marginTop:18}}>Full name<input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>
    <label className="form-field" style={{marginTop:16}}>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label className="form-field" style={{marginTop:16}}>Password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
    <label className="form-field" style={{marginTop:16}}>Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter the same password again"/></label>
    <button className="btn-primary" disabled={busy} style={{marginTop:20}} type="submit">{busy?"Creating account…":"Create account ↗"}</button>
    {error && <p role="alert" className="notice" style={{marginTop:15}}>{error}</p>}
    {message && <p role="status" className="notice" style={{marginTop:15}}>{message}</p>}
    <p className="muted" style={{fontSize:13,marginTop:20}}>Already have an account? <Link className="text-link" href="/login">Sign in</Link></p>
  </form></section>;
}
