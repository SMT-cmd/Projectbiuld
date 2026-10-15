"use client";

import "./builder.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Copy, FileText, RotateCcw } from "lucide-react";

const stages = ["Project basics", "Research focus", "Study approach", "Your outline"];
const departments = [
  "Business Administration", "Computer Science", "Education", "Accounting & Finance",
  "Public Health", "Mass Communication", "Political Science", "Economics",
  "Library & Information Science", "Agricultural Science", "Nursing Science", "Project Management", "Other"
];

export default function BuildMyProjectPage() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Business Administration");
  const [level, setLevel] = useState("Undergraduate");
  const [setting, setSetting] = useState("");
  const [problem, setProblem] = useState("");
  const [aim, setAim] = useState("");
  const [method, setMethod] = useState("Survey");
  const [population, setPopulation] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const outline = useMemo(() => {
    const focus = title.trim() || "[Enter your research topic]";
    const context = setting.trim() || "[Specify your institution, organisation, or study area]";
    const issue = problem.trim() || "[Describe the issue using credible sources and local evidence]";
    const mainAim = aim.trim() || "To investigate " + focus.toLowerCase() + " in " + context + ".";
    const target = population.trim() || "[Define the population and sampling frame]";
    return [
      "RESEARCH PLANNING BRIEF",
      "Topic: " + focus,
      "Department: " + department,
      "Academic level: " + level,
      "Study setting: " + context,
      "",
      "1. Background and problem to investigate",
      issue,
      "",
      "2. Proposed aim",
      mainAim,
      "",
      "3. Draft specific objectives",
      "• Describe the current situation relating to " + focus.toLowerCase() + " in the selected setting.",
      "• Identify key factors, experiences, or barriers associated with the issue.",
      "• Examine how the selected factors relate to the outcome being studied.",
      "• Develop practical recommendations supported by the evidence collected.",
      "",
      "4. Draft research questions",
      "• What is the current situation relating to the topic in the selected setting?",
      "• Which factors or experiences do participants identify as important?",
      "• How are the selected factors related to the issue being investigated?",
      "• What evidence-based improvements may be recommended?",
      "",
      "5. Suggested study approach",
      "Initial design: " + method,
      "Potential participants or data source: " + target,
      "Confirm that this design fits the research question, your institution's requirements, your timeframe, and available resources.",
      "",
      "6. Scope and practical limits",
      "Define the location, period, concepts, and population covered. Note likely constraints such as access, time, budget, and response rates.",
      "",
      "7. Next steps",
      "• Find and verify recent scholarly sources relevant to the topic.",
      "• Refine the problem statement with evidence from the chosen setting.",
      "• Check the objectives and questions with your supervisor.",
      "• Obtain required ethics approval and informed consent before collecting data.",
      "• Do not invent findings, participant responses, references, or statistics.",
      notes.trim() ? "\nAdditional instructions\n" + notes.trim() : ""
    ].join("\n");
  }, [title, department, level, setting, problem, aim, method, population, notes]);

  async function copyOutline() {
    try {
      await navigator.clipboard.writeText(outline);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function downloadOutline() {
    const blob = new Blob([outline], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "researchhub-planning-brief.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function next() { setStep((current) => Math.min(3, current + 1)); }
  function back() { setStep((current) => Math.max(0, current - 1)); }
  function reset() {
    setStep(0); setTitle(""); setDepartment("Business Administration"); setLevel("Undergraduate");
    setSetting(""); setProblem(""); setAim(""); setMethod("Survey"); setPopulation(""); setNotes("");
  }

  return <section className="page-content builder-page">
    <Link href="/topics" className="text-link"><ArrowLeft size={15} style={{display:"inline"}}/> Browse topic ideas</Link>
    <div className="builder-heading">
      <div className="eyebrow">YOUR RESEARCH WORKSPACE</div>
      <h1>Build My Project</h1>
      <p className="muted">Turn an early idea into a structured planning brief. Work through the steps at your own pace, then copy or save your outline.</p>
    </div>
    <div className="builder-progress" aria-label={"Step " + (step + 1) + " of 4"}>
      {stages.map((stage, i) => <div className={"builder-step" + (i === step ? " active" : "") + (i < step ? " complete" : "")} key={stage}>
        <span>{i < step ? <CheckCircle2 size={16}/> : i + 1}</span><small>{stage}</small>
      </div>)}
    </div>
    <div className="builder-layout">
      <div className="builder-form-card">
        {step === 0 && <>
          <div className="builder-card-icon"><BookOpenCheck size={22}/></div>
          <h2>Start with the basics</h2><p className="muted">Tell us what you are researching and the academic context.</p>
          <label className="form-field">Working research topic<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Digital banking and customer satisfaction" /></label>
          <label className="form-field">Department<select value={department} onChange={e=>setDepartment(e.target.value)}>{departments.map(d=><option key={d}>{d}</option>)}</select></label>
          <label className="form-field">Academic level<select value={level} onChange={e=>setLevel(e.target.value)}><option>Undergraduate</option><option>HND / ND</option><option>Postgraduate</option><option>Other</option></select></label>
        </>}
        {step === 1 && <>
          <div className="builder-card-icon"><FileText size={22}/></div>
          <h2>Clarify the research problem</h2><p className="muted">A strong project starts with a specific, evidence-based problem.</p>
          <label className="form-field">Study setting<input value={setting} onChange={e=>setSetting(e.target.value)} placeholder="e.g. selected small businesses in Lagos" /></label>
          <label className="form-field">What issue do you want to investigate?<textarea rows={5} value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Describe what is happening, who it affects, and what you still need to understand." /></label>
          <label className="form-field">Main aim (optional)<textarea rows={3} value={aim} onChange={e=>setAim(e.target.value)} placeholder="What should this study find out?" /></label>
        </>}
        {step === 2 && <>
          <div className="builder-card-icon"><CheckCircle2 size={22}/></div>
          <h2>Choose a feasible study approach</h2><p className="muted">These choices are a starting point, not a substitute for supervisor or ethics review.</p>
          <label className="form-field">Initial research design<select value={method} onChange={e=>setMethod(e.target.value)}><option>Survey</option><option>Interviews</option><option>Case study</option><option>Document analysis</option><option>Experiment</option><option>Mixed methods</option><option>Secondary data analysis</option></select></label>
          <label className="form-field">Potential participants or data source<input value={population} onChange={e=>setPopulation(e.target.value)} placeholder="e.g. customers of a selected bank" /></label>
          <label className="form-field">Institution or supervisor instructions (optional)<textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add required chapter structure, word limits, or other guidance. Do not include sensitive personal data." /></label>
        </>}
        {step === 3 && <>
          <div className="builder-card-icon"><CheckCircle2 size={22}/></div>
          <h2>Your planning brief is ready</h2><p className="muted">Review the draft, edit the steps if needed, then copy it or save a text version for your next working session.</p>
          <div className="builder-checklist"><p><CheckCircle2 size={16}/> Working title and academic context</p><p><CheckCircle2 size={16}/> Draft aim, objectives and research questions</p><p><CheckCircle2 size={16}/> Initial method and scope prompts</p><p><CheckCircle2 size={16}/> Responsible next steps</p></div>
          <div className="notice">This is a planning template, not a completed academic project. Verify all claims and sources, and follow your institution's academic integrity rules.</div>
          <div className="builder-actions"><button className="btn-primary" type="button" onClick={copyOutline}><Copy size={16}/>{copied ? "Copied!" : "Copy outline"}</button><button className="btn-secondary" type="button" onClick={downloadOutline}>Save as text</button></div>
        </>}
        <div className="builder-nav">
          <button className="btn-secondary" type="button" onClick={back} disabled={step===0}>Back</button>
          {step < 3 ? <button className="btn-primary" type="button" onClick={next}>Continue <ArrowRight size={16}/></button> : <button className="btn-secondary" type="button" onClick={reset}><RotateCcw size={15}/> Start over</button>}
        </div>
      </div>
      <aside className="builder-preview">
        <div className="preview-label">LIVE PROJECT SUMMARY</div>
        <h3>{title.trim() || "Your research title"}</h3>
        <div className="preview-meta"><span>{department}</span><span>{level}</span></div>
        <div className="preview-rule"/>
        <h4>Research setting</h4><p>{setting.trim() || "Your selected location or organisation will appear here."}</p>
        <h4>Research problem</h4><p>{problem.trim() || "Add a short description of the issue you want to understand."}</p>
        <h4>Study approach</h4><p>{method}{population.trim() ? " · " + population : ""}</p>
        <div className="preview-note">Your brief updates as you work. Nothing is submitted to a server by this page.</div>
      </aside>
    </div>
  </section>;
}
