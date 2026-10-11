"use client";

import { useState, type FormEvent } from "react";

/**
 * Presentational only: no write endpoint is wired until server-side
 * authorization, atomic audit and database transition guards are tested.
 */
export function EvidenceForm() {
  const [notice, setNotice] = useState("");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Evidence submission is not enabled yet. Your draft was not saved.");
  }
  return (
    <form onSubmit={onSubmit} aria-label="Passport evidence draft">
      <h2>Submit official-source evidence</h2>
      <p>Draft interface only. No data is transmitted or saved.</p>
      <label htmlFor="rule-id">Rule ID</label>
      <input id="rule-id" name="ruleId" required maxLength={160} />
      <label htmlFor="passport-code">Passport code (ISO alpha-3)</label>
      <input id="passport-code" name="passportCode" required pattern="[A-Z]{3}" maxLength={3} />
      <label htmlFor="destination-code">Destination code (ISO alpha-3)</label>
      <input id="destination-code" name="destinationCode" required pattern="[A-Z]{3}" maxLength={3} />
      <label htmlFor="source-url">Official source URL</label>
      <input id="source-url" name="sourceUrl" required type="url" pattern="https://.*" />
      <label htmlFor="rationale">Evidence rationale</label>
      <textarea id="rationale" name="rationale" required minLength={20} maxLength={8000} />
      <button type="submit">Check draft availability</button>
      <p role="status">{notice}</p>
    </form>
  );
}
