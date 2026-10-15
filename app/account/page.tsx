import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, FileText, UserRound } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/ssr";
import SignOutButton from "./sign-out-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <section className="page-content"><div className="form-card">
      <div className="eyebrow">MY ACCOUNT</div><h1 style={{ fontSize: 34 }}>Account services are not connected yet</h1>
      <p className="muted">ResearchHub needs its Supabase project URL and public anon/publishable key to support secure sign-in. The site should not store passwords or pretend an account exists until that service is configured.</p>
      <div className="notice">Site administrator: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the ResearchHub Vercel project, then redeploy. Apply the included Supabase schema/migration before enabling saved project drafts.</div>
      <p style={{ marginTop: 18 }}><Link className="text-link" href="/login">Go to sign in ↗</Link> · <Link className="text-link" href="/signup">Create account ↗</Link></p>
    </div></section>;
  }

  const supabase = await createServerSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login?next=/account");

  let profile: { display_name: string | null; role: string } | null = null;
  try {
    const result = await supabase.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle();
    profile = result.data;
  } catch { /* show the basic account if the optional profile query is unavailable */ }

  const draftResult = await supabase.from("project_drafts")
    .select("id,title,department,academic_level,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const displayName = profile?.display_name || (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") || "ResearchHub member";

  return <>
    <section className="page-hero"><div className="eyebrow">YOUR RESEARCH SPACE</div><h1>My account</h1><p>Manage your account and retrieve the planning briefs you have saved.</p></section>
    <div className="page-content account-layout">
      <section className="form-card account-profile">
        <div className="dept-icon"><UserRound /></div>
        <h2>{displayName}</h2><p className="muted">{user.email}</p>
        <p className="account-role">{profile?.role === "admin" ? "Administrator" : "Customer account"}</p>
        <SignOutButton />
      </section>
      <section className="account-drafts">
        <div className="account-section-heading"><div><div className="eyebrow">SAVED WORK</div><h2>My project briefs</h2></div><Link href="/build-my-project" className="btn-primary"><BookOpenCheck size={16}/> Build a project</Link></div>
        {draftResult.error
          ? <div className="notice">Project saving is not ready yet. Apply <code>supabase/migrations/20261015_researchhub_project_drafts.sql</code> in the connected Supabase project's SQL editor, then refresh this page.</div>
          : draftResult.data?.length
            ? <div className="saved-draft-list">{draftResult.data.map((draft) => <article className="saved-draft" key={draft.id}>
              <div className="saved-draft-icon"><FileText size={18}/></div>
              <div className="saved-draft-info"><h3>{draft.title}</h3><p>{draft.department} · {draft.academic_level} · {new Date(draft.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p></div>
              <div className="saved-draft-actions"><a href={"/api/project-drafts/" + draft.id + "?format=doc"}>Word</a><a href={"/api/project-drafts/" + draft.id + "?format=txt"}>Text</a></div>
            </article>)}</div>
            : <div className="empty-state"><h3>No saved briefs yet</h3><p>Create a planning brief and select “Save to my account” to keep it here. Drafts are private to your signed-in account.</p><Link className="text-link" href="/build-my-project">Start a planning brief ↗</Link></div>}
      </section>
    </div>
  </>;
}
