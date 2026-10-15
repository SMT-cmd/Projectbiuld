import { allTopics } from "@/lib/topics";

export const dynamic = "force-dynamic";

type DownloadContext = { params: Promise<{ slug: string }> };

type LiteratureRecord = {
  id: string;
  title: string;
  year: number | null;
  authors: string[];
  venue: string | null;
  doi: string | null;
  url: string;
  openAccess: boolean;
  abstract: string;
};

type OpenAlexRecord = {
  id?: string;
  title?: string | null;
  publication_year?: number | null;
  doi?: string | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }>;
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string | null } | null } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
};

async function fetchTopicLiterature(topic: (typeof allTopics)[number]): Promise<{ records: LiteratureRecord[]; searchedAt: string | null }> {
  const query = [topic.title, ...topic.tags].join(" ").slice(0, 180);
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", "6");
  url.searchParams.set("sort", "relevance_score:desc");
  url.searchParams.set("select", "id,title,publication_year,doi,authorships,primary_location,open_access,abstract_inverted_index");
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "ResearchHub/1.0 (topic-pack literature discovery)" },
      signal: AbortSignal.timeout(7500),
      next: { revalidate: 1800 },
    });
    if (!response.ok) {
      console.error("OpenAlex download lookup returned", response.status);
      return { records: [], searchedAt: null };
    }
    const payload = await response.json() as { results?: OpenAlexRecord[] };
    const records = (payload.results || []).filter((item) => item.id && item.title).map((item) => {
      const inverted = item.abstract_inverted_index || {};
      const abstractWords = Object.entries(inverted).flatMap(([word, positions]) =>
        positions.map((position) => ({ word, position }))
      ).sort((a, b) => a.position - b.position);
      const abstract = abstractWords.map((item) => item.word).join(" ").replace(/\s+/g, " ").trim();
      const doi = item.doi ? item.doi.replace(/^https?:\/\/doi\.org\//i, "") : null;
      const oaUrl = item.open_access?.oa_url || null;
      const landingUrl = item.primary_location?.landing_page_url || null;
      return {
        id: item.id!,
        title: item.title!,
        year: item.publication_year ?? null,
        authors: (item.authorships || []).map((entry) => entry.author?.display_name).filter((name): name is string => Boolean(name)).slice(0, 5),
        venue: item.primary_location?.source?.display_name || null,
        doi,
        url: oaUrl || landingUrl || (doi ? "https://doi.org/" + doi : item.id!),
        openAccess: Boolean(item.open_access?.is_oa && oaUrl),
        abstract: abstract.slice(0, 1600),
      };
    });
    return { records, searchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("OpenAlex download lookup failed", error instanceof Error ? error.message : "unknown error");
    return { records: [], searchedAt: null };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

function buildGuide(topic: (typeof allTopics)[number]) {
  const tags = topic.tags;
  const keywords = tags.map((tag) => tag.toLowerCase());
  const query = encodeURIComponent([topic.title, ...tags].join(" "));
  const aim = `To investigate ${topic.title.toLowerCase()} in a clearly defined study setting.`;
  const objectives = [
    `Describe the current situation, practices, or experiences relating to ${topic.title.toLowerCase()} in the selected setting.`,
    `Identify the key factors, barriers, or enabling conditions reported by the study population.`,
    `Examine how the main concepts in the topic relate to one another, where the chosen design permits this.`,
    `Develop practical recommendations that are supported by verified literature and the data actually collected.`,
  ];
  const questions = [
    `What is the current situation relating to ${topic.title.toLowerCase()} in the selected setting?`,
    `Which factors or experiences do participants identify as important?`,
    `How do the selected concepts relate to the problem being investigated?`,
    `What improvements are supported by the evidence?`,
  ];
  const literatureThemes = [
    `Definitions, concepts, and context for ${topic.title.toLowerCase()}`,
    `Recent empirical evidence about ${keywords[0] || topic.title.toLowerCase()}`,
    `Factors, barriers, enabling conditions, and outcomes discussed in prior studies`,
    `Theories or conceptual models used by credible studies in this field`,
    `Methodological strengths, limitations, and gaps in the available literature`,
  ];
  const methods = topic.department === "Computer Science"
    ? "A system evaluation, usability study, security-awareness assessment, or case study may fit, depending on the exact research question. Define test tasks and evaluation criteria before testing any system; do not access systems or data without permission."
    : ["Public Health", "Nursing Science"].includes(topic.department)
      ? "A descriptive survey, approved record review, interview study, or mixed-method design may be appropriate. Obtain required institutional and ethics approvals before recruiting participants or accessing health information; collect only data needed for the stated objectives."
      : ["Mass Communication", "Library & Information Science"].includes(topic.department)
        ? "A survey, interview study, or systematic content/document analysis may fit. If analysing media or records, define the source, time period, sampling rules, coding categories, and method for checking consistency."
        : ["Agricultural Science", "Economics", "Accounting & Finance"].includes(topic.department)
          ? "A cross-sectional survey, interview study, or analysis of authorised secondary data may fit. Define variables, units of analysis, geographic/sector scope, and the limits of self-reported or observational evidence."
          : "A focused case study, descriptive survey, semi-structured interview study, or a carefully justified mixed-method design may fit. Choose the method that answers the questions, define sampling and measures in advance, and obtain permission before collecting data.";
  const scope = "Limit the project to a named population or data source, a specific location or organisation type, defined concepts, and a feasible study period. Explain why this boundary is appropriate.";
  const questionnaire = [
    "What is your role or relationship to the issue being studied? (Use non-identifying response categories where possible.)",
    `How familiar are you with ${keywords[0] || "the issue under study"}? (Provide a clear response scale and a not-applicable option.)`,
    "Which factors most affect your experience or decision in this area? (Allow respondents to select more than one option if suitable.)",
    "What main barriers or challenges have you experienced?",
    "What practical change or support would improve the current situation?",
  ];
  const nextSteps = [
    "Confirm topic scope and approval with your supervisor before treating this draft as a final proposal.",
    "Search the scholarly discovery links below and read the original papers; record exact authors, dates, methods, findings, and limitations.",
    "Use a literature matrix to compare studies instead of making an annotated list with no synthesis.",
    "Match each objective to a research question, evidence source, and analysis method.",
    "Obtain the required permissions and ethics approval before data collection.",
    "Use only genuine collected or authorised secondary data. Never invent participants, results, statistics, quotations, or references.",
    "Follow your institution's rules on AI assistance, citation, formatting, and academic integrity.",
  ];
  return { query, aim, objectives, questions, literatureThemes, methods, scope, questionnaire, nextSteps };
}

function asText(topic: (typeof allTopics)[number], guide: ReturnType<typeof buildGuide>, literature: LiteratureRecord[], searchedAt: string | null) {
  return [
    "RESEARCHHUB — RESEARCH TOPIC PACK",
    topic.title,
    `Department: ${topic.department}`,
    "",
    "IMPORTANT NOTE",
    "This is an editable research-planning and proposal guide, not a completed academic research report. It does not fabricate findings or claim that a literature search has already been completed. Verify sources and adapt the material to your institution's requirements.",
    "",
    "1. TOPIC OVERVIEW",
    topic.summary,
    topic.abstract,
    "",
    "2. PROBLEM-FRAMING STARTER",
    `A problem statement should explain what is happening about ${topic.title.toLowerCase()}, who is affected, what credible evidence shows, what is not yet known in the chosen setting, and why the gap matters. Insert and cite verifiable local and scholarly evidence; do not present the topic summary above as proof of a local problem.`,
    "",
    "3. PROPOSED AIM",
    guide.aim,
    "",
    "4. DRAFT OBJECTIVES",
    ...guide.objectives.map((item, index) => `${index + 1}. ${item}`),
    "",
    "5. DRAFT RESEARCH QUESTIONS",
    ...guide.questions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "6. LITERATURE REVIEW THEMES TO DEVELOP",
    ...guide.literatureThemes.map((item, index) => `${index + 1}. ${item}`),
    "",
    "7. POSSIBLE METHODOLOGY",
    guide.methods,
    "Specify research design, population, sample and sampling procedure, instrument, validity/reliability or qualitative trustworthiness, data collection procedure, analysis plan, ethics, and data protection.",
    "",
    "8. SCOPE",
    guide.scope,
    "",
    "9. SAMPLE QUESTIONNAIRE PROMPTS — ADAPT AND VALIDATE",
    ...guide.questionnaire.map((item, index) => `${index + 1}. ${item}`),
    "",
    "10. SUGGESTED CHAPTER STRUCTURE",
    "Chapter One — Introduction: background with citations, problem statement, aim/objectives, research questions (and hypotheses where justified), significance, scope, and operational definitions.",
    "Chapter Two — Literature Review: conceptual review, theories/framework, critical review of relevant empirical studies, synthesis, and the specific research gap supported by sources.",
    "Chapter Three — Methodology: design, setting, population, sampling, instrument/materials, validity/trustworthiness, procedures, analysis, and ethical considerations.",
    "Chapter Four — Results and Discussion: report only real analysed data or genuine documented findings; present appropriate tables/figures and compare results with literature.",
    "Chapter Five — Summary, Conclusion and Recommendations: answer each research question from the findings, state limits, and give proportionate recommendations.",
    "",
    "11. RESPONSIBLE NEXT STEPS",
    ...guide.nextSteps.map((item, index) => `${index + 1}. ${item}`),
    "",
    "12. LIVE SCHOLARLY RECORDS — METADATA RETRIEVED FOR THIS DOWNLOAD",
    searchedAt ? "Lookup time: " + searchedAt : "A live lookup could not be completed while this pack was generated.",
    ...(literature.length ? literature.flatMap((record, index) => [
      `${index + 1}. ${record.authors.length ? record.authors.join(", ") : "Author details not supplied"} (${record.year ?? "n.d."}). ${record.title}. ${record.venue || "Publication venue not supplied"}.`,
      record.doi ? "DOI: https://doi.org/" + record.doi : "DOI: not supplied in metadata",
      "Record: " + record.url,
      record.abstract ? "Abstract metadata: " + record.abstract : "Abstract not available in the returned metadata.",
      record.openAccess ? "Open-access URL is listed in metadata; check any licence and reuse conditions." : "Open full text is not confirmed by the returned metadata.",
      ""
    ]) : ["No publication records were retrieved at download time. Use the live search links below to try again."]),
    "These are candidate records returned by a relevance search, not a quality appraisal or a claim that the works support every statement in this topic pack. Open each original record, verify its authorship, date, content, and suitability, and cite only sources you actually read.",
    "",
    "13. SCHOLARLY SEARCH LINKS",
    `OpenAlex: https://api.openalex.org/works?search=${guide.query}`,
    `Google Scholar: https://scholar.google.com/scholar?q=${guide.query}`,
    `Crossref: https://search.crossref.org/?q=${guide.query}`,
    "",
    "14. KEYWORDS",
    topic.tags.join("; "),
    "",
    "Prepared by ResearchHub as an editable planning aid. No real findings, quotations, or bibliography entries are fabricated in this document.",
  ].join("\n");
}

function asWordHtml(topic: (typeof allTopics)[number], guide: ReturnType<typeof buildGuide>, literature: LiteratureRecord[], searchedAt: string | null) {
  const esc = escapeHtml;
  const list = (items: string[]) => items.map((item) => `<li>${esc(item)}</li>`).join("");
  const queryLinks = [
    ["OpenAlex", `https://api.openalex.org/works?search=${guide.query}`],
    ["Google Scholar", `https://scholar.google.com/scholar?q=${guide.query}`],
    ["Crossref", `https://search.crossref.org/?q=${guide.query}`],
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(topic.title)} — ResearchHub Guide</title>
<style>body{font-family:Calibri,Arial,sans-serif;color:#1c2c42;line-height:1.6;font-size:11pt}h1{color:#174ea6;font-size:23pt}h2{color:#174ea6;border-bottom:1px solid #dce5f2;padding-bottom:4px;font-size:15pt;margin-top:24px}h3{color:#263f61}p,li{line-height:1.65}.notice{background:#eef4ff;border-left:4px solid #174ea6;padding:12px}.meta{color:#5b6c80}.url{word-break:break-all}</style></head><body>
<p class="meta">RESEARCHHUB · RESEARCH TOPIC PACK</p><h1>${esc(topic.title)}</h1><p><strong>Department:</strong> ${esc(topic.department)}</p>
<div class="notice"><strong>Important:</strong> This is an editable research-planning and proposal guide, not a completed academic project. It does not invent findings or pretend a literature search has already been done. Verify sources and adapt every section to your institution's requirements.</div>
<h2>1. Topic overview</h2><p>${esc(topic.summary)}</p><p>${esc(topic.abstract)}</p>
<h2>2. Problem-framing starter</h2><p>A problem statement should explain what is happening about <em>${esc(topic.title.toLowerCase())}</em>, who is affected, what credible evidence shows, what is not yet known in the selected setting, and why the gap matters. Insert and cite verifiable local and scholarly evidence; the topic summary above is not proof of a local problem.</p>
<h2>3. Proposed aim</h2><p>${esc(guide.aim)}</p>
<h2>4. Draft specific objectives</h2><ol>${list(guide.objectives)}</ol>
<h2>5. Draft research questions</h2><ol>${list(guide.questions)}</ol>
<h2>6. Literature review themes to develop</h2><ol>${list(guide.literatureThemes)}</ol>
<h2>7. Possible methodology</h2><p>${esc(guide.methods)}</p><p>Specify research design, population, sample and sampling procedure, instruments, validity/reliability or qualitative trustworthiness, data collection, analysis, ethics, and data protection.</p>
<h2>8. Scope</h2><p>${esc(guide.scope)}</p>
<h2>9. Sample questionnaire prompts — adapt and validate</h2><ol>${list(guide.questionnaire)}</ol>
<h2>10. Suggested chapter structure</h2>
<h3>Chapter One — Introduction</h3><p>Background with citations, problem statement, aim/objectives, research questions (and hypotheses where justified), significance, scope, and operational definitions.</p>
<h3>Chapter Two — Literature Review</h3><p>Conceptual review, theoretical/conceptual framework, critical review of empirical studies, synthesis, and a research gap supported by actual sources.</p>
<h3>Chapter Three — Methodology</h3><p>Design, setting, population, sampling, instrument/materials, validity/trustworthiness, procedures, analysis, ethical considerations, and data protection.</p>
<h3>Chapter Four — Results and Discussion</h3><p>Report only real analysed data or genuine documented findings. Present appropriate tables/figures and compare verified results with relevant literature. Do not create or present invented data as real.</p>
<h3>Chapter Five — Summary, Conclusion and Recommendations</h3><p>Answer each research question from actual findings, acknowledge limitations, and make recommendations proportionate to the evidence.</p>
<h2>11. Responsible next steps</h2><ol>${list(guide.nextSteps)}</ol>
<h2>12. Live scholarly records — metadata retrieved for this download</h2><p>Lookup time: ${searchedAt ? esc(searchedAt) : "live lookup unavailable at download time"}.</p>${literature.length ? literature.map((record, index) => `<article><h3>${index + 1}. <a href="${esc(record.url)}">${esc(record.title)}</a></h3><p>${esc(record.authors.join(", ") || "Author details not supplied")}${record.year ? " (" + record.year + ")" : ""}${record.venue ? " · " + esc(record.venue) : ""}</p>${record.doi ? `<p>DOI: <a href="https://doi.org/${esc(record.doi)}">https://doi.org/${esc(record.doi)}</a></p>` : ""}${record.abstract ? `<p>${esc(record.abstract)}</p>` : "<p>Abstract metadata was not provided.</p>"}<p>${record.openAccess ? "An open-access URL is listed in metadata; check its licence and reuse conditions." : "Open full text is not confirmed by the returned metadata."}</p></article>`).join("") : "<p>No publication records were retrieved when this file was generated. Use the external discovery links to run a search.</p>"}<p class="notice">These are candidate search records, not a quality appraisal. Open and read each original source before citing it. Confirm title, authors, date, methods and relevance independently.</p>
<h2>13. Scholarly discovery links</h2><ul>${queryLinks.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a> — ${esc(decodeURIComponent(href))}</li>`).join("")}</ul>
<h2>14. Keywords</h2><p>${topic.tags.map(esc).join(" · ")}</p>
<hr><p class="meta">Prepared by ResearchHub as an editable planning aid. No real findings, quotations, or bibliography entries are fabricated in this document.</p></body></html>`;
}

export async function GET(request: Request, { params }: DownloadContext) {
  const { slug } = await params;
  const topic = allTopics.find((item) => item.slug === slug);
  if (!topic) return new Response("Topic not found", { status: 404 });
  const guide = buildGuide(topic);
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "doc").toLowerCase();
  const safeSlug = topic.slug.replace(/[^a-z0-9-]/gi, "");
  if (format === "txt") {
    return new Response(asText(topic, guide, literature, searchedAt), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="researchhub-${safeSlug}-topic-pack.txt"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new Response(asWordHtml(topic, guide, literature, searchedAt), {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="researchhub-${safeSlug}-topic-pack.doc"`,
      "Cache-Control": "no-store",
    },
  });
}
