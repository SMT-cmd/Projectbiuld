"use client";

import { useState } from "react";
import { ExternalLink, Search, BookOpen, LoaderCircle } from "lucide-react";

type Work = {
  id: string;
  title: string;
  year: number | null;
  authors: string[];
  venue: string | null;
  doi: string | null;
  url: string;
  openAccess: boolean;
  citedByCount: number;
  abstract: string;
};

export default function LiteratureSearch({ query }: { query: string }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const response = await fetch("/api/literature?q=" + encodeURIComponent(query), {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Literature search is temporarily unavailable.");
      setWorks(payload.works || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retrieve research records.");
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="research-literature" aria-labelledby="literature-heading">
      <div className="eyebrow">LIVE SCHOLARLY DISCOVERY</div>
      <h2 id="literature-heading">Find published research for this topic</h2>
      <p className="muted">Search scholarly metadata from OpenAlex. Open a record to inspect its publisher or repository page and verify whether the full text is available.</p>
      <button className="btn-primary" type="button" onClick={search} disabled={loading}>
        {loading ? <><LoaderCircle size={17} className="spin"/> Searching literature…</> : <><Search size={17}/> Search scholarly literature</>}
      </button>
      {!searched && <p className="literature-note">Results are fetched when you press search; the site does not claim every item is free to read.</p>}
      {error && <p role="alert" className="notice" style={{ marginTop: 16 }}>{error}</p>}
      {searched && !loading && !error && works.length === 0 && <div className="empty-state" style={{ marginTop: 16 }}>No matching publication records were returned. Try a broader phrase in the external search links below.</div>}
      {works.length > 0 && <div className="literature-results">
        <p className="literature-note">{works.length} records found. Confirm the author, publication date, methods, and relevance before citing.</p>
        {works.map((work) => <article className="literature-result" key={work.id}>
          <div className="literature-result-icon"><BookOpen size={18}/></div>
          <div>
            <h3><a href={work.url} target="_blank" rel="noreferrer">{work.title} <ExternalLink size={13} style={{ display: "inline", verticalAlign: "middle" }}/></a></h3>
            <p>{work.authors.length ? work.authors.join(", ") : "Author details not supplied"}{work.year ? " · " + work.year : ""}{work.venue ? " · " + work.venue : ""}</p>
            {work.abstract && <p className="literature-abstract">{work.abstract}{work.abstract.length >= 1800 ? "…" : ""}</p>}
            <div className="topic-meta">
              {work.openAccess && <span>Open-access link listed</span>}
              {work.citedByCount > 0 && <span>{work.citedByCount.toLocaleString()} citations listed</span>}
              {work.doi && <a href={"https://doi.org/" + work.doi} target="_blank" rel="noreferrer">DOI ↗</a>}
            </div>
          </div>
        </article>)}
      </div>}
      <div className="literature-shortcuts">
        <a href={"https://scholar.google.com/scholar?q=" + encodeURIComponent(query)} target="_blank" rel="noreferrer">Search Google Scholar ↗</a>
        <a href={"https://search.crossref.org/?q=" + encodeURIComponent(query)} target="_blank" rel="noreferrer">Search Crossref ↗</a>
      </div>
    </section>
  );
}
