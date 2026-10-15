"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { departments } from "@/lib/catalog";

export default function RequestForm({ initialTopic = "", initialDepartment = "" }: { initialTopic?: string; initialDepartment?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: new FormData(event.currentTarget),
        headers: { Accept: "application/json" },
        redirect: "follow",
      });
      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "We could not save this request. Your details have not been submitted; please try again later.");
        setBusy(false);
        return;
      }
      setError("The server returned an unexpected response. Please check again before submitting a duplicate request.");
    } catch {
      setError("We could not reach the request service. Your request has not been confirmed as saved. Please check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        <label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="notice" style={{ marginBottom: 22 }}>
        Use this form for academic guidance and material enquiries. Do not include passwords, sensitive personal data, or confidential participant information. A confirmation appears only after the server accepts the request.
      </div>
      <div className="form-grid">
        <label className="form-field">Full name<input name="name" required minLength={2} maxLength={100} placeholder="Your name" autoComplete="name" /></label>
        <label className="form-field">Email address<input type="email" name="email" required maxLength={254} placeholder="you@example.com" autoComplete="email" /></label>
        <label className="form-field">WhatsApp / phone (optional)<input name="phone" maxLength={30} placeholder="+234…" autoComplete="tel" /></label>
        <label className="form-field">Department<select name="department" defaultValue={initialDepartment} required><option value="" disabled>Select department</option>{departments.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}</select></label>
        <label className="form-field full">Topic or project title<input name="topic" defaultValue={initialTopic} required minLength={3} maxLength={250} placeholder="What are you researching?" /></label>
        <label className="form-field">Support needed<select name="support_type" required defaultValue="topic-guidance"><option value="topic-guidance">Topic guidance</option><option value="research-outline">Research outline</option><option value="material-enquiry">Existing material enquiry</option><option value="writing-support">Academic writing support</option></select></label>
        <label className="form-field">Target date (optional)<input type="date" name="target_date" /></label>
        <label className="form-field full">Additional details<textarea name="details" maxLength={4000} placeholder="Describe your requirements, institution guidelines, and any questions." /></label>
      </div>
      {error && <p role="alert" className="notice request-error" style={{ marginTop: 18 }}><AlertCircle size={17} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />{error}</p>}
      <button className="btn-primary" style={{ marginTop: 22 }} type="submit" disabled={busy}>
        {busy ? <><LoaderCircle size={17} className="spin" /> Sending request…</> : <><Send size={16} /> Send request ↗</>}
      </button>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Submitting a request does not create an order or charge you. If request storage is not configured, the page will tell you instead of pretending the request was saved.</p>
      <p aria-live="polite" className="sr-only">{busy ? "Sending your request" : ""}</p>
    </form>
  );
}
