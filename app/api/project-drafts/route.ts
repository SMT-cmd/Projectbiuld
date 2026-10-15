import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

const draftSchema = z.object({
  title: z.string().trim().min(3).max(250),
  department: z.string().trim().min(2).max(120),
  academicLevel: z.string().trim().min(2).max(80),
  setting: z.string().max(500).optional().default(""),
  problem: z.string().max(4000).optional().default(""),
  aim: z.string().max(2000).optional().default(""),
  methodology: z.string().trim().min(2).max(100).default("Survey"),
  population: z.string().max(500).optional().default(""),
  notes: z.string().max(3000).optional().default(""),
  outline: z.string().trim().min(30).max(30000),
});

async function authenticatedClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function POST(request: Request) {
  try {
    const parsedBody = await request.json().catch(() => null);
    const parsed = draftSchema.safeParse(parsedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please complete the topic and check that your planning brief is valid." }, { status: 400 });
    }

    const auth = await authenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: "Saving projects is not configured yet. The site administrator must connect Supabase authentication first." }, { status: 503 });
    }
    if (!auth.user) {
      return NextResponse.json({ error: "Sign in to save this planning brief to your account." }, { status: 401 });
    }

    const { data, error } = await auth.supabase.from("project_drafts").insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      department: parsed.data.department,
      academic_level: parsed.data.academicLevel,
      study_setting: parsed.data.setting,
      research_problem: parsed.data.problem,
      aim: parsed.data.aim,
      methodology: parsed.data.methodology,
      population: parsed.data.population,
      supervisor_notes: parsed.data.notes,
      outline: parsed.data.outline,
    }).select("id,title,created_at").single();

    if (error) {
      console.error("Project draft insert failed", error.message);
      const notReady = error.code === "42P01" || error.code === "PGRST205";
      return NextResponse.json({
        error: notReady
          ? "Project saving is not connected to the database yet. Apply the ResearchHub project-drafts migration in Supabase, then try again."
          : "We could not save this brief. Please try again after the database configuration is checked.",
      }, { status: notReady ? 503 : 500 });
    }
    return NextResponse.json({ draft: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The save request could not be processed. Please try again." }, { status: 400 });
  }
}
