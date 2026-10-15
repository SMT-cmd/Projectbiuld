import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ status: z.enum(["new", "reviewing", "responded", "closed"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "The admin request service is not configured yet." }, { status: 503 });
    }
    const sessionClient = await createServerSupabase();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in with an administrator account." }, { status: 401 });

    const { data: profile, error: profileError } = await sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || profile?.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return NextResponse.json({ error: "Choose a valid request status." }, { status: 400 });

    const { id } = await params;
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.from("requests").update({ status: body.data.status }).eq("id", id).select("id,status").maybeSingle();
    if (error) {
      console.error("Admin request update failed", error.message);
      return NextResponse.json({ error: "The request status could not be updated." }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    return NextResponse.json({ request: data });
  } catch {
    return NextResponse.json({ error: "The request status could not be updated." }, { status: 400 });
  }
}
