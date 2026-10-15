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
    "10. FIVE-CHAPTER PROJECT WRITING FRAMEWORK",
    "",
    "CHAPTER ONE — INTRODUCTION",
    "1.1 Background of the study: Move from the wider international/disciplinary context to the relevant region and then the selected local setting. Define the key concepts, explain what credible prior evidence says, compare important perspectives, and cite original sources for factual statements. Do not treat a generic topic description as evidence of a local problem.",
    "1.2 Statement of the problem: Although " + topic.title.toLowerCase() + " is the subject of interest, the specific problem must be demonstrated in the chosen context. Explain who is affected, what evidence confirms the issue, what is already known, what remains uncertain or understudied, and why the gap matters. Insert current local statistics or documented observations only when a verifiable source is available.",
    "Problem statement evidence prompt: In [setting/population], [specific issue] appears in [documented evidence/source]. Existing studies have investigated [what the sources actually report], but evidence about [specific local gap] remains limited or inconsistent. This study will examine [bounded issue] using [proposed method]. Replace each bracketed phrase with verified information; do not leave placeholders in a submitted proposal.",
    "1.3 Aim: " + guide.aim,
    "1.4 Specific objectives:",
    ...guide.objectives.map((item, index) => (index + 1) + ". " + item),
    "1.5 Research questions:",
    ...guide.questions.map((item, index) => (index + 1) + ". " + item),
    "1.6 Research hypotheses: Include testable null/alternative hypotheses only if the design, variables, and analysis justify them. Qualitative and descriptive projects may not need formal hypotheses.",
    "1.7 Significance: Explain how the study may be useful to the specific intended groups (for example, practitioners, managers, policy staff, students or researchers) without promising benefits that the evidence cannot establish.",
    "1.8 Scope: State the exact concepts, population/data source, geographic or organisational boundary, and time period.",
    "1.9 Limitations: Identify practical constraints and explain how the design will reduce or acknowledge them.",
    "1.10 Operational definitions: Define important terms as they are used and measured in this particular study, supported by appropriate sources.",
    "",
    "CHAPTER TWO — LITERATURE REVIEW",
    "2.1 Conceptual review: Define the core concepts in this topic using authoritative academic sources. Compare definitions where scholars disagree and state which operational definition the project will use.",
    "2.2 Theoretical or conceptual framework: Select a theory or model only after reading its primary/authoritative source and demonstrating why it helps explain the research question. Define its constructs and show how they guide the proposed variables, interview themes, or analytical categories.",
    "2.3 Empirical review: For every study, record the author/year, setting, objective, design, sample/data, analysis, principal reported finding, limitation, and relevance to this project. Summarise the original study accurately rather than copying snippets or inventing findings.",
    "2.4 Critical synthesis: Compare where studies agree, differ, or use different populations, methods and measures. Explain how these differences affect confidence and transferability. A literature review should synthesise evidence rather than merely list article summaries.",
    "2.5 Research gap: Derive the gap from the literature records you have actually read. A different city, population or date is not automatically a meaningful gap; explain why the difference matters.",
    "Literature themes to develop:",
    ...guide.literatureThemes.map((item, index) => (index + 1) + ". " + item),
    "Literature evidence matrix columns: Author/year | context | objective | design/sample | measure or themes | findings actually reported | limitations | relevance to this topic.",
    "",
    "CHAPTER THREE — METHODOLOGY",
    "3.1 Research design: " + guide.methods,
    "3.2 Study setting/data context: Describe the selected location, organisation, platform, archive, or dataset and justify the choice with appropriate evidence.",
    "3.3 Population or data corpus: Define who/what can be included and excluded. State the sampling frame where one exists.",
    "3.4 Sample and sampling: State the proposed sample size, sampling technique, eligibility criteria, recruitment/access route and justification. Calculate sample sizes transparently where relevant rather than selecting an arbitrary number.",
    "3.5 Instrument/materials: Describe questionnaires, interview guides, observation forms, technical test tasks, coding sheets or secondary-data fields. Attach the final instrument in an appendix after piloting and supervisor review.",
    "3.6 Validity, reliability or trustworthiness: Explain pilot testing, expert review, scale reliability, triangulation, audit trail, intercoder checks or other methods appropriate to the design. Do not claim these checks were completed before they occur.",
    "3.7 Data collection: Give a repeatable step-by-step procedure, timeline, permissions, and secure data-handling plan.",
    "3.8 Analysis plan: Map each objective and question to its evidence source and analysis technique. Quantitative analysis may use suitable descriptive statistics and justified tests; qualitative analysis may use transparent coding and theme development; technical studies must define metrics and test conditions.",
    "3.9 Ethics and data protection: Explain informed consent, voluntary participation, confidentiality, minimisation of sensitive data, secure storage, withdrawal, and institutional approval where required. For health research or studies involving minors, obtain the appropriate specialist and institutional approvals.",
    "Method alignment matrix: Objective | question | variable/theme | data source | instrument/item | analysis technique.",
    "",
    "CHAPTER FOUR — RESULTS AND DISCUSSION (COMPLETE ONLY AFTER REAL ANALYSIS)",
    "This chapter must not be filled with invented data, fabricated respondents, made-up quotations, or hypothetical statistics presented as actual findings. It can be drafted as a structure before data collection, but results and conclusions must wait for genuine evidence.",
    "4.1 Evidence/data preparation: Report the actual number of eligible, collected and analysed observations, missing-data decisions, exclusions, and any appropriate quality checks.",
    "4.2 Participant/source profile: Provide only necessary non-identifying characteristics and explain the denominator for every percentage.",
    "4.3 Results by objective/question: Present each result in the order of the research objectives. Use clear tables/figures or coded themes, define the unit and denominator, label missing values, and do not duplicate every table value in prose.",
    "4.4 Discussion: Interpret what the observed results do and do not show. Compare with verified prior studies, explain plausible differences, and distinguish association, participants' perceptions, and causation. Do not generalise beyond the study design or sample.",
    "Results table shell: [objective/question] | [measure/theme] | [actual result] | [data source/denominator] | [interpretation] | [comparison with verified literature]. Leave it blank until genuine results exist.",
    "",
    "CHAPTER FIVE — SUMMARY, CONCLUSION AND RECOMMENDATIONS",
    "5.1 Summary: Concisely state the problem, aim, design, actual evidence analysed, and the major findings without introducing new results.",
    "5.2 Conclusion: Answer each research question using the collected evidence. If results are inconclusive, mixed or limited, state this rather than forcing a positive conclusion.",
    "5.3 Recommendations: Link each recommendation to a specific finding, name the intended audience, and explain a feasible next action. Do not promise outcomes unsupported by the study.",
    "5.4 Contribution and limitations: State what the project adds in this context and what its sample, measures, design, time period or access prevents it from establishing.",
    "5.5 Future research: Suggest focused follow-up studies that address limitations identified in the actual project.",
    "",
    "REFERENCES AND APPENDICES",
    "Use the citation style required by the institution. Check every reference against the original publisher, DOI, repository record or library catalogue; include only works that you actually read and cited in the text. Append approved instruments, participant information/consent documents, permission letters, and relevant supplementary materials, removing personal identifiers where needed.",
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
<h2>10. Five-chapter project writing framework</h2>
<h3>CHAPTER ONE — INTRODUCTION</h3>
<p><strong>1.1 Background of the study.</strong> Move from the wider disciplinary context to the region and then the selected local setting. Define key concepts, compare credible existing evidence and cite original sources. Do not treat a generic topic description as evidence of a local problem.</p>
<p><strong>1.2 Statement of the problem.</strong> Although \${esc(topic.title.toLowerCase())} is the subject of interest, the specific problem must be demonstrated in the chosen context. Explain who is affected, what verifiable evidence confirms the issue, what is already known, what remains uncertain and why the gap matters. Insert current local statistics only when a reliable source exists.</p>
<p><strong>Problem-framing starter:</strong> In [setting/population], [specific issue] appears in [documented evidence/source]. Existing studies have investigated [what the sources actually report], but evidence about [specific local gap] remains limited or inconsistent. This study will examine [bounded issue] using [proposed method]. Replace all bracketed phrases with verified information before submitting.</p>
<p><strong>1.3 Aim.</strong> \${esc(guide.aim)}</p>
<h4>1.4 Specific objectives</h4><ol>\${list(guide.objectives)}</ol>
<h4>1.5 Research questions</h4><ol>\${list(guide.questions)}</ol>
<p><strong>1.6 Hypotheses:</strong> Include testable hypotheses only if the design, variables and analysis justify them. <strong>1.7 Significance:</strong> Explain potential value to specific groups without promising unsupported benefits. <strong>1.8 Scope:</strong> Define concepts, participants/data, location/organisation and period. <strong>1.9 Limitations:</strong> Explain realistic constraints and how they will be addressed. <strong>1.10 Operational definitions:</strong> Define key terms as used in this study, with sources where appropriate.</p>
<h3>CHAPTER TWO — LITERATURE REVIEW</h3>
<p><strong>2.1 Conceptual review:</strong> Define the key concepts with authoritative sources and compare differing definitions. <strong>2.2 Theory/framework:</strong> Select a model only after verifying its primary or authoritative source and explaining how its constructs guide the study. <strong>2.3 Empirical review:</strong> For each source, record its setting, objective, method, data/sample, analysis, actual reported findings, limitations, and relevance. <strong>2.4 Critical synthesis:</strong> Compare agreements and differences across studies; do not simply list summaries. <strong>2.5 Research gap:</strong> Derive the gap from records you have read and explain why it matters.</p>
<h4>Literature themes to develop</h4><ol>\${list(guide.literatureThemes)}</ol>
<p><strong>Literature matrix:</strong> Author/year | context | objective | design/sample | measures or themes | findings actually reported | limitations | relevance.</p>
<h3>CHAPTER THREE — METHODOLOGY</h3>
<p><strong>3.1 Research design:</strong> \${esc(guide.methods)}</p>
<p><strong>3.2 Study setting/data context:</strong> Describe and justify the location, organisation, platform, archive or dataset. <strong>3.3 Population/data corpus:</strong> Define eligibility and exclusions. <strong>3.4 Sampling:</strong> State sample size, frame, technique, recruitment, eligibility and justification. <strong>3.5 Instrument/materials:</strong> Explain questionnaires, interview guides, coding sheets, test tasks or secondary data fields. <strong>3.6 Quality checks:</strong> Describe appropriate piloting, validity/reliability, triangulation or intercoder procedures; never claim an unperformed check.</p>
<p><strong>3.7 Data collection:</strong> Provide a repeatable procedure and timeline. <strong>3.8 Analysis plan:</strong> Map every objective to its evidence source and technique. <strong>3.9 Ethics:</strong> Explain consent, confidentiality, data minimisation, storage, permission and required institutional approval.</p>
<p><strong>Method alignment matrix:</strong> Objective | question | variable/theme | source | instrument/item | analysis technique.</p>
<h3>CHAPTER FOUR — RESULTS AND DISCUSSION (ONLY AFTER REAL ANALYSIS)</h3>
<p>This chapter must not contain invented respondents, fabricated quotations, made-up statistics, or hypothetical data presented as real results. Draft the structure now; fill it only after analysing genuine evidence.</p>
<p><strong>4.1 Evidence preparation:</strong> Report actual eligible/collected/analysed observations, missing data and exclusions. <strong>4.2 Source profile:</strong> Include only necessary non-identifying characteristics and state denominators. <strong>4.3 Results by question/objective:</strong> Use clear tables or documented themes, with labels, measures and denominators. <strong>4.4 Discussion:</strong> Interpret what the results do and do not show and compare with sources actually read; distinguish perception, association and causation.</p>
<p><strong>Results table shell:</strong> objective/question | measure/theme | actual result | source/denominator | interpretation | comparison with verified literature. Leave this unfilled until genuine data exist.</p>
<h3>CHAPTER FIVE — SUMMARY, CONCLUSION AND RECOMMENDATIONS</h3>
<p><strong>5.1 Summary:</strong> Restate the problem, aim, design and actual evidence analysed. <strong>5.2 Conclusion:</strong> Answer each research question using findings, including mixed or inconclusive findings. <strong>5.3 Recommendations:</strong> Link each proposed action to a specific finding and a feasible intended user. <strong>5.4 Contribution and limitations:</strong> Explain what the study adds and what its design prevents it from establishing. <strong>5.5 Future research:</strong> Recommend focused work that responds to the limitations discovered.</p>
<h3>References and appendices</h3><p>Follow your required citation style. Check every reference against the original publisher, DOI, repository or library catalogue, and cite only works you have actually read. Append approved instruments, participant information/consent documents and permission letters, removing unnecessary personal identifiers.</p>
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
  const { records: literature, searchedAt } = await fetchTopicLiterature(topic);
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
