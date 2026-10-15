import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Inbox } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import RequestStatusControl from "./status-control";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support request inbox" };

export default async function AdminRequestsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <section className="page-content"><div className="form-card"><h1>Request inbox is not configured</h1><p className="muted">Connect Supabase authentication and the request database to review incoming support requests.</p></div></section>;
  }
  const sessionClient = await createServerSupabase();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) redirect("/login?next=/admin/requests");
  const { data: profile, error: profileError } = await sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return <section className="page-content"><div className="form-card"><h1 style={{ fontSize: 32 }}>Admin access required</h1><p className="muted">The request inbox contains private enquiries and is only available to approved administrators.</p><Link className="text-link" href="/account">Return to my account ↗</Link></div></section>;
  }

  let requests: Array<{ id: string; name: string; email: string; phone: string; department: string; topic: string; support_type: string; target_date: string | null; details: string; status: "new" | "reviewing" | "responded" | "closed"; created_at: string }> = [];
  let loadError = "";
  try {
    const admin = createSupabaseAdmin();
    const result = await admin.from("requests").select("id,name,email,phone,department,topic,support_type,target_date,details,status,created_at").order("created_at", { ascending: false }).limit(100);
    if (result.error) throw result.error;
    requests = (result.data || []) as typeof requests;
  } catch {
    loadError = "The request records could not be read. Confirm that the requests table exists and SUPABASE_SERVICE_ROLE_KEY is configured for the ResearchHub project.";
  }

  const newCount = requests.filter((item) => item.status === "new").length;
  return <>
    <section className="page-hero"><Link href="/admin" className="text-link"><ArrowLeft size={14} style={{ display: "inline" }} /> Admin dashboard</Link><div className="eyebrow" style={{ marginTop: 18 }}>PRIVATE OPERATIONS</div><h1>Support request inbox</h1><p>Submitted support forms are stored in Supabase's requests table. Review each enquiry here and update its status as you follow up.</p></section>
    <div className="page-content">
      <div className="request-inbox-summary"><div><div className="eyebrow">REQUESTS LOADED</div><strong>{requests.length}</strong></div><div><div className="eyebrow">NEW</div><strong>{newCount}</strong></div><div className="request-inbox-summary-icon"><Inbox size={26}/></div></div>
      {loadError && <div className="notice" role="alert">{loadError}</div>}
      {!loadError && requests.length === 0 && <div className="empty-state"><h2>No support requests yet</h2><p>When someone completes the support form and its submission is saved successfully, it will appear in this inbox.</p><Link className="text-link" href="/request">Open the public support form ↗</Link></div>}
      <div className="request-inbox-list">
        {requests.map((item) => <article className="request-inbox-card" key={item.id}>
          <div className="request-inbox-top"><div><div className="eyebrow">{item.department} · {item.support_type.replaceAll("-", " ")}</div><h2>{item.topic}</h2></div><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></div>
          <div className="request-contact"><strong>{item.name}</strong><a href={"mailto:" + item.email + "?subject=" + encodeURIComponent("ResearchHub enquiry: " + item.topic)}><Mail size={14}/>{item.email}</a>{item.phone && <a href={"https://wa.me/" + item.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer"><MessageCircle size={14}/>{item.phone}</a>}</div>
          {item.target_date && <p className="request-target">Target date: {item.target_date}</p>}
          {item.details && <p className="request-details">{item.details}</p>}
          <div className="request-inbox-footer"><span className={"request-status-pill status-" + item.status}>{item.status.replaceAll("-", " ")}</span><RequestStatusControl id={item.id} initialStatus={item.status}/></div>
        </article>)}
      </div>
      {requests.length === 100 && <p className="muted">Showing the 100 most recent requests.</p>}
    </div>
  </>;
}
