import RequestForm from "./request-form";

export const metadata = { title: "Request research support" };

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ topic?: string; department?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <section className="page-hero">
        <div className="eyebrow">LET'S FIND YOUR NEXT STEP</div>
        <h1>Request research support</h1>
        <p>Share your requirements so the team can understand your topic, timeframe, and the kind of guidance you need.</p>
      </section>
      <div className="page-content">
        <RequestForm initialTopic={params.topic || ""} initialDepartment={params.department || ""} />
      </div>
    </>
  );
}
