export type ReviewQueueItem = {
  id: string;
  ruleId: string;
  passportCode: string;
  destinationCode: string;
  status: "submitted" | "changes_requested";
};

export function ReviewQueue({ items }: { items: readonly ReviewQueueItem[] }) {
  return (
    <section aria-label="Evidence review queue">
      <h2>Independent review queue</h2>
      {items.length === 0 ? <p>No submissions loaded. Live reviewer access is not enabled.</p> : (
        <ul>{items.map((item) => (
          <li key={item.id}>
            <strong>{item.ruleId}</strong> — {item.passportCode} to {item.destinationCode}
            <span> ({item.status})</span>
          </li>
        ))}</ul>
      )}
    </section>
  );
}
