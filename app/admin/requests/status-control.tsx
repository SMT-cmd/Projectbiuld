"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

type RequestStatus = "new" | "reviewing" | "responded" | "closed";

export default function RequestStatusControl({ id, initialStatus }: { id: string; initialStatus: RequestStatus }) {
  const [status, setStatus] = useState<RequestStatus>(initialStatus);
  const [savedStatus, setSavedStatus] = useState<RequestStatus>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (status === savedStatus || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/requests/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error || "Could not update request status.");
      } else {
        setSavedStatus(status);
        setMessage("Status saved");
      }
    } catch {
      setMessage("Could not reach the status service.");
    }
    setBusy(false);
  }

  return <div className="request-status-control">
    <select aria-label="Request status" value={status} onChange={(event) => { setStatus(event.target.value as RequestStatus); setMessage(""); }}>
      <option value="new">New</option><option value="reviewing">Reviewing</option><option value="responded">Responded</option><option value="closed">Closed</option>
    </select>
    <button className="btn-secondary" type="button" onClick={save} disabled={busy || status === savedStatus}>
      {busy ? <LoaderCircle size={14} className="spin"/> : status === savedStatus && message === "Status saved" ? <Check size={14}/> : null}
      Save
    </button>
    {message && <small role="status">{message}</small>}
  </div>;
}
