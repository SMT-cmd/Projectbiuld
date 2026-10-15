import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OpenAlexWork = {
  id?: string;
  title?: string | null;
  publication_year?: number | null;
  doi?: string | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }>;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  cited_by_count?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().slice(0, 180);
  if (query.length < 3) {
    return NextResponse.json({ error: "Enter a topic or at least three keywords." }, { status: 400 });
  }

  const apiUrl = new URL("https://api.openalex.org/works");
  apiUrl.searchParams.set("search", query);
  apiUrl.searchParams.set("per_page", "8");
  apiUrl.searchParams.set("sort", "relevance_score:desc");
  apiUrl.searchParams.set("select", "id,title,publication_year,doi,authorships,primary_location,open_access,cited_by_count");

  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json", "User-Agent": "ResearchHub/1.0 (scholarly discovery)" },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 60 * 30 },
    });
    if (!response.ok) {
      console.error("OpenAlex lookup returned", response.status);
      return NextResponse.json(
        { error: "The scholarly search service did not respond. Use the Google Scholar or Crossref links instead." },
        { status: 502 },
      );
    }
    const payload = await response.json() as { results?: OpenAlexWork[] };
    const works = (payload.results || [])
      .filter((work) => work.title && work.id)
      .map((work) => {
        const doi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//i, "") : null;
        const oaUrl = work.open_access?.oa_url || null;
        const landingUrl = work.primary_location?.landing_page_url || null;
        const fallbackUrl = doi ? "https://doi.org/" + doi : work.id!;
        return {
          id: work.id!,
          title: work.title!,
          year: work.publication_year ?? null,
          authors: (work.authorships || [])
            .map((item) => item.author?.display_name)
            .filter((name): name is string => Boolean(name))
            .slice(0, 4),
          venue: work.primary_location?.source?.display_name || null,
          doi,
          url: oaUrl || landingUrl || fallbackUrl,
          openAccess: Boolean(work.open_access?.is_oa && oaUrl),
          citedByCount: work.cited_by_count || 0,
        };
      });
    return NextResponse.json({ works, source: "OpenAlex", returnedAt: new Date().toISOString() });
  } catch (error) {
    console.error("OpenAlex lookup failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Could not reach the scholarly search service. Please try again or use the external search links." },
      { status: 502 },
    );
  }
}
