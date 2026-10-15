import Link from "next/link";
import { Download, Search } from "lucide-react";
import { departments } from "@/lib/catalog";
import { allTopics } from "@/lib/topics";

export const metadata = {
  title: "Project Topics",
  description: "Browse 100 original topic ideas and download editable research planning guides across 12 academic departments.",
};

export default async function TopicsPage({ searchParams }: { searchParams: Promise<{ q?: string; department?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const department = params.department || "";
  const topics = allTopics.filter((topic) =>
    (!query || [topic.title, topic.summary, topic.abstract, topic.department, ...topic.tags].join(" ").toLowerCase().includes(query)) &&
    (!department || topic.departmentSlug === department)
  );

  return <>
    <section className="page-hero">
      <div className="eyebrow">TOPIC LIBRARY · {allTopics.length} IDEAS</div>
      <h1>Find your research direction</h1>
      <p>Browse {allTopics.length} research topic ideas across {departments.length} departments. Open any topic for a detailed guide, search published literature, or download an editable Word planning pack.</p>
    </section>
    <div className="page-content">
      <form className="filter-row" action="/topics">
        <input name="q" defaultValue={params.q} placeholder="Search by topic, keyword, or department…" aria-label="Search topics" />
        <select name="department" defaultValue={department} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
        </select>
        <button className="btn-primary" type="submit"><Search size={16} /> Search topics</button>
      </form>
      <div className="catalogue-result-heading"><p className="muted"><strong>{topics.length}</strong> topic {topics.length === 1 ? "idea" : "ideas"} found{query ? <> for <strong>“{params.q}”</strong></> : null}{department ? <> in <strong>{departments.find((item) => item.slug === department)?.name || "selected department"}</strong></> : null}.</p>
        <p className="catalogue-disclaimer">These are original research starting points, not claims that studies have already been conducted.</p>
      </div>
      {topics.length ? <div className="topic-list">
        {topics.map((topic, index) => <article className="topic-card" key={topic.slug}>
          <div className="topic-number">{String(index + 1).padStart(2, "0")}</div>
          <div>
            <h3><Link href={"/topics/" + topic.slug}>{topic.title}</Link></h3>
            <p>{topic.summary}</p>
            <p className="muted">{topic.abstract}</p>
            <div className="topic-meta">
              <span>{topic.department}</span>
              {topic.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              <Link className="text-link" href={"/topics/" + topic.slug}>Open topic ↗</Link>
              <a className="topic-download-quick" href={"/topics/" + topic.slug + "/download?format=doc"}><Download size={13} /> Word guide</a>
            </div>
          </div>
        </article>)}
      </div> : <div className="empty-state"><h2>No topics match those filters</h2><p>Try a broader keyword or select all departments.</p><Link className="text-link" href="/topics">Clear filters ↗</Link></div>}
      <section className="research-guide catalogue-help">
        <div className="eyebrow">STILL LOOKING?</div><h2>Find a topic that fits your course</h2>
        <p>Use the research builder to narrow an idea by setting, problem, population, and method, or submit a support request with your department's requirements.</p>
        <div className="catalogue-bottom-actions"><Link className="btn-primary" href="/build-my-project">Build My Project ↗</Link><Link className="btn-secondary" href="/request">Request topic support ↗</Link></div>
      </section>
    </div>
  </>;
}
