import Link from "next/link";
import { CheckCircle2, Inbox } from "lucide-react";

export default function RequestSuccess() {
  return <section className="page-content"><div className="form-card request-success-card">
    <div className="dept-icon"><CheckCircle2 /></div>
    <div className="eyebrow">REQUEST RECEIVED</div>
    <h1 style={{ fontSize: 36 }}>Your support request was saved.</h1>
    <p className="muted">Your submission has been recorded in ResearchHub's support-request database. An authorised administrator can review it from the private request inbox and follow up using the email or phone number you supplied.</p>
    <div className="notice"><Inbox size={17} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />Destination: the ResearchHub <strong>requests</strong> table in Supabase, viewable from <strong>Admin dashboard → Request inbox</strong>. This page does not imply that an email has already been sent.</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}><Link className="btn-primary" href="/">Back to homepage</Link><Link className="btn-secondary" href="/topics">Browse topics</Link></div>
  </div></section>;
}
