import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Download, FileText, Search } from "lucide-react";
import LiteratureSearch from "./literature-search";
import { allTopics } from "@/lib/topics";

export function generateStaticParams() {
  return allTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = allTopics.find((item) => item.slug === slug);
  return {
    title: topic?.title || "Research topic",
    description: topic?.summary,
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function suggestedMethod(department: string) {
  if (department === "Computer Science") return "A system evaluation, usability study, security-awareness assessment, or technical case study may fit. Define evaluation criteria before testing; do not access systems or user data without permission.";
  if (["Public Health", "Nursing Science"].includes(department)) return "A descriptive survey, approved record review, interview study, or mixed-method design may fit. Obtain all required institutional and ethics approvals before recruiting participants or accessing health information.";
  if (["Mass Communication", "Library & Information Science"].includes(department)) return "A survey, interview study, or systematic content/document analysis may fit. For content analysis, define the sources, study period, sampling rules, coding categories, and approach to consistency.";
  if (["Agricultural Science", "Economics", "Accounting & Finance"].includes(department)) return "A cross-sectional survey, interview study, or analysis of authorised secondary data may fit. Define variables, units of analysis, setting, and the limits of observational or self-reported evidence.";
  return "A focused case study, descriptive survey, semi-structured interview study, or justified mixed-method design may fit. Choose a method that directly answers the research questions, define sampling and measures in advance, and obtain permission before collecting data.";
}

export default async function TopicDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = allTopics.find((item) => item.slug === slug);
  if (!topic) notFound();

  const related = allTopics.filter((item) => item.departmentSlug === topic.departmentSlug && item.slug !== topic.slug).slice(0, 4);
  const objectives = [
    `Describe current practices, experiences, or conditions relating to ${topic.title.toLowerCase()} in the selected setting.`,
    `Identify the key factors, barriers, or enabling conditions associated with ${topic.tags[0] || "the issue under study"}.`,
    `Examine how the main concepts relate to one another, to the extent the chosen research design permits.`,
    "Develop practical recommendations that are supported by verified literature and the data actually collected.",
  ];
  const questions = [
    `What is the current situation relating to ${topic.title.toLowerCase()} in the selected setting?`,
    `Which factors or experiences shape ${topic.tags[0] || "the issue being studied"}?`,
    "How do participants or credible documentary sources describe the main barriers and enabling conditions?",
    "What improvements are supported by the collected evidence and literature?",
  ];
  const literatureThemes = [
    `Core concepts and definitions: ${topic.tags.map(titleCase).join(", ")}`,
    "Theoretical or conceptual frameworks used in studies in this field",
    "Recent empirical studies: context, samples, measures, findings, and limitations",
    "Competing explanations and differences across populations or settings",
    "Evidence gaps relevant to the proposed location, participant group, or period",
  ];

  return (
    <>
      <section className="page-hero">
        <Link href="/topics" className="text-link"><ArrowLeft size={14} style={{ display: "inline" }} /> Back to topics</Link>
        <div className="eyebrow" style={{ marginTop: 20 }}>{topic.department}</div>
        <h1>{topic.title}</h1>
        <p>{topic.summary}</p>
      </section>
      <div className="page-content">
        <div className="topic-download-bar">
          <div>
            <strong>Take this topic with you</strong>
            <p className="muted">Download an editable topic pack with a proposal framework, suggested objectives, research questions, literature themes and sample instrument prompts.</p>
          </div>
          <div className="topic-download-actions">
            <a className="btn-primary" href={`/topics/${topic.slug}/download?format=doc`}><Download size={16} /> Download Word guide</a>
            <a className="btn-secondary" href={`/topics/${topic.slug}/download?format=txt`}><FileText size={16} /> Text version</a>
          </div>
        </div>
        <div className="notice" style={{ marginBottom: 26 }}>
          This free download is a research-planning guide, not a fabricated completed project. Chapter four must contain real, analysed data or genuine documented findings; all references must be independently verified and cited.
        </div>
        <div className="topic-detail-layout">
          <article>
            <h2>About this research idea</h2>
            <p>{topic.abstract}</p>

            <section className="topic-explainer">
              <h2>Problem framing: what needs to be investigated?</h2>
              <p>{`The study can explore ${topic.title.toLowerCase()} in a particular institution, community, organisation, sector, or participant group. Before writing a final problem statement, establish what credible sources already show, describe what is not yet known in your selected setting, and explain why that gap matters. The topic summary is a starting point, not evidence that a problem exists in every location.`}</p>
              <h2>Proposed aim</h2>
              <p>{`To investigate ${topic.title.toLowerCase()} in a clearly defined study setting.`}</p>
              <h2>Possible research objectives</h2>
              <ol>{objectives.map((item) => <li key={item}>{item}</li>)}</ol>
              <h2>Sample research questions</h2>
              <ol>{questions.map((item) => <li key={item}>{item}</li>)}</ol>
              <h2>Literature review: useful themes to investigate</h2>
              <ul>{literatureThemes.map((item) => <li key={item}>{item}</li>)}</ul>
              <h2>Suggested methodology</h2>
              <p>{suggestedMethod(topic.department)}</p>
              <p>For the proposal, define the research design, study setting, target population, sampling frame and technique, instrument or data source, data collection procedure, analysis plan, and any validity, reliability, or qualitative trustworthiness checks that apply. Explain why the method fits each question.</p>
              <h2>Scope and likely limitations</h2>
              <p>Limit the study to a named population or data source, a practical location or organisation type, defined concepts, and a feasible study period. Note access, time, cost, sample size, response, measurement, and generalisability constraints as relevant. Avoid causal claims when the design can only show description or association.</p>
              <h2>Sample question prompts</h2>
              <ul>
                <li>How familiar are you with {topic.tags[0] || "the issue under study"}?</li>
                <li>Which factors most affect your experience or decision in this area?</li>
                <li>What barriers have you experienced, and what support is available?</li>
                <li>What practical change would improve the current situation?</li>
              </ul>
            </section>

            <section className="research-guide">
              <div className="eyebrow">A PRACTICAL STARTING POINT</div>
              <h2>Recommended next steps</h2>
              <ol>
                <li><strong>Narrow the topic.</strong> Set a clear population, location, time period and outcome that you can realistically study.</li>
                <li><strong>Confirm the problem with evidence.</strong> Use credible scholarly articles and local/official data rather than unsupported claims.</li>
                <li><strong>Compare literature critically.</strong> Record each source’s context, methods, findings, and limitations; do not simply list article summaries.</li>
                <li><strong>Match methods to questions.</strong> Identify which evidence will answer each research question and how it will be analysed.</li>
                <li><strong>Plan access and ethics.</strong> Seek permissions, informed consent and required institutional approval before collecting data.</li>
                <li><strong>Review your department’s handbook.</strong> Required chapter order, formatting, methods, citations and AI rules may differ by institution.</li>
              </ol>
              <p className="guide-note">Use this as a working guide. Do not invent findings, questionnaire responses, quotations, statistics, or references; verify all claims and cite the original source.</p>
            </section>

            <h2 style={{ marginTop: 35 }}>Keywords for literature searches</h2>
            {topic.tags.map((tag) => <span key={tag} className="paper-tag" style={{ marginRight: 8 }}>{tag}</span>)}

            <LiteratureSearch query={topic.title + " " + topic.tags.join(" ")} />
          </article>
          <aside className="form-card topic-support-card" style={{ height: "fit-content" }}>
            <div className="dept-icon"><BookOpen /></div>
            <h3>Need help narrowing this topic?</h3>
            <p className="muted" style={{ fontSize: 13 }}>Ask about the study scope, research structure, methodology, or available material for this specific topic.</p>
            <p style={{ fontSize: 13 }}><CheckCircle2 size={15} color="#147d62" style={{ display: "inline", verticalAlign: "middle" }} /> Discuss your requirements</p>
            <Link className="btn-primary" style={{ width: "100%", marginTop: 12 }} href={"/request?topic=" + encodeURIComponent(topic.title) + "&department=" + encodeURIComponent(topic.department)}>Request support <ArrowRight size={16} /></Link>
            <a className="topic-search-link" href={"https://scholar.google.com/scholar?q=" + encodeURIComponent(topic.title)} target="_blank" rel="noreferrer"><Search size={15} /> Search this title on Google Scholar ↗</a>
          </aside>
        </div>
        {related.length > 0 && <section style={{ paddingTop: 50 }}>
          <h2>More ideas in {topic.department}</h2>
          <div className="topic-list">
            {related.map((item) => <article className="topic-card" key={item.slug}>
              <div className="topic-number">↗</div><div><h3><Link href={"/topics/" + item.slug}>{item.title}</Link></h3><p>{item.summary}</p></div>
            </article>)}
          </div>
        </section>}
      </div>
    </>
  );
}
