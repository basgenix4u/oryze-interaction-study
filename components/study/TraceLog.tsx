export type TraceEntry = {
  id: string;
  label: string;
  date: string;
  time: string;
  state: "traced" | "pending";
  isNew?: boolean;
};

type TraceLogProps = {
  newEntry?: TraceEntry | null;
};

const initialEntries: readonly TraceEntry[] = [
  {
    id: "relance-1",
    label: "Relance 1 · tracée",
    date: "05/08",
    time: "09:14",
    state: "traced",
  },
  {
    id: "relance-2-prepared",
    label: "Relance 2 · préparée · à envoyer",
    date: "",
    time: "",
    state: "pending",
  },
];

export function TraceLog({ newEntry = null }: TraceLogProps) {
  const entries = newEntry ? [...initialEntries, newEntry] : initialEntries;

  return (
    <div className="trace-log">
      <h3 className="trace-log__title">Historique des relances</h3>
      <ol
        aria-label="Historique des relances"
        aria-live="polite"
        aria-relevant="additions text"
        className="trace-log__list"
      >
        {entries.map((entry) => (
          <li
            className={[
              "trace-log__row",
              `trace-log__row--${entry.state}`,
              entry.isNew ? "trace-log__row--new" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={entry.id}
          >
            <span aria-hidden="true" className="trace-log__dot" />
            <span className="trace-log__label">{entry.label}</span>
            <span className="trace-log__time">
              {entry.date && entry.time ? (
                <>
                  {entry.date}
                  <span aria-hidden="true"> · </span>
                  {entry.time}
                </>
              ) : (
                <span aria-label="En attente">—</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
