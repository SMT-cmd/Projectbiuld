import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Saved projects are not configured yet." }, { status: 503 });
    }
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Sign in to download your saved project." }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase
      .from("project_drafts")
      .select("id,title,department,academic_level,study_setting,research_problem,aim,methodology,population,supervisor_notes,outline,created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("Saved project lookup failed", error.message);
      return NextResponse.json({ error: "Saved project storage is not available right now." }, { status: 503 });
    }
    if (!data) return NextResponse.json({ error: "Saved project not found." }, { status: 404 });

    const format = new URL(request.url).searchParams.get("format") || "txt";
    const safeTitle = data.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "research-project";
    if (format !== "doc") {
      return new Response(data.outline, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="researchhub-${safeTitle}.txt"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const escape = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escape(data.title)}</title><style>body{font-family:Calibri,Arial,sans-serif;line-height:1.6;color:#1c2c42}h1{color:#174ea6}pre{white-space:pre-wrap;font-family:Calibri,Arial,sans-serif} .notice{background:#eef4ff;padding:12px;border-left:4px solid #174ea6}</style></head><body><h1>${escape(data.title)}</h1><p><strong>Department:</strong> ${escape(data.department)} · <strong>Level:</strong> ${escape(data.academic_level)}</p><p class="notice">This is your saved research planning brief, not a completed research report. Verify sources and use real evidence.</p><pre>${escape(data.outline)}</pre></body></html>`;
    return new Response(html, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="researchhub-${safeTitle}.doc"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "The saved project could not be retrieved." }, { status: 400 });
  }
}
