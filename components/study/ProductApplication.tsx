"use client";

import { useEffect, useState } from "react";
import { Button, type ButtonPhase } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { oryzeTokens } from "@/lib/tokens";

type ProductHistoryEntry =
  | {
      id: string;
      state: "traced" | "promise";
      prefix: string;
      date: string;
      time?: string;
    }
  | {
      id: string;
      state: "prepared";
      text: string;
    };

type ProductRelance = {
  id: string;
  initials: string;
  client: string;
  reference: string;
  dueDate: string;
  amount: string;
  overdueDays: number;
  nextRelance: number;
  history: readonly ProductHistoryEntry[];
  replaceHistoryIndex?: number;
};

const productRelances = [
  {
    id: "studio-nord",
    initials: "SN",
    client: "Studio Nord",
    reference: "FAC-2026-0038",
    dueDate: "02/08",
    amount: "860,00\u202f€",
    overdueDays: 10,
    nextRelance: 2,
    replaceHistoryIndex: 1,
    history: [
      {
        id: "relance-1",
        state: "traced",
        prefix: "Relance 1 · tracée le",
        date: "12/08",
      },
      {
        id: "relance-2-prepared",
        state: "prepared",
        text: "Relance 2 · préparée · à envoyer",
      },
    ],
  },
  {
    id: "menuiserie-roux",
    initials: "MR",
    client: "Menuiserie Roux",
    reference: "FAC-2026-0031",
    dueDate: "26/07",
    amount: "2\u202f340,00\u202f€",
    overdueDays: 10,
    nextRelance: 2,
    history: [
      {
        id: "relance-1",
        state: "traced",
        prefix: "Relance 1 · tracée le",
        date: "05/08",
      },
      {
        id: "promise",
        state: "promise",
        prefix: "Promesse de règlement ·",
        date: "25/08",
      },
    ],
  },
] satisfies readonly ProductRelance[];

const productContexts = [
  { context: "Factures", label: "Encaisser" },
  { context: "Dépenses", label: "Importer un justificatif" },
  { context: "TVA", label: "Préparer la déclaration" },
  { context: "Documents", label: "Exporter le FEC" },
  { context: "Relances", label: "Envoyer la relance" },
  { context: "Comptes", label: "Nouveau virement" },
] as const;

function getLocalTraceTime(): { date: string; time: string } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  return { date, time };
}

function HistoryEntryView({ entry }: { entry: ProductHistoryEntry }) {
  if (entry.state === "prepared") {
    return <span>{entry.text}</span>;
  }

  return (
    <>
      <span>{entry.prefix} </span>
      <time className="mono">{entry.date}</time>
      {entry.time ? (
        <>
          <span aria-hidden="true"> · </span>
          <time className="mono">{entry.time}</time>
        </>
      ) : null}
    </>
  );
}

function ProductRelanceRow({ data }: { data: ProductRelance }) {
  const [phase, setPhase] = useState<ButtonPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [traceTime, setTraceTime] = useState<{ date: string; time: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (phase !== "working") return;

    const writeTrace = () => {
      const stamp = getLocalTraceTime();
      setTraceTime(stamp);
      setProgress(1);
      setPhase("done");
      setAnnouncement(
        `Trace ajoutée à l'historique, le ${stamp.date} à ${stamp.time}. Aucune relance réelle n'a été envoyée.`,
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      writeTrace();
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const drawProgress = (now: number) => {
      const nextProgress = Math.min(
        1,
        (now - startedAt) / oryzeTokens.interaction.simulatedSendMs,
      );
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        writeTrace();
        return;
      }

      frame = window.requestAnimationFrame(drawProgress);
    };

    frame = window.requestAnimationFrame(drawProgress);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const dynamicEntry: ProductHistoryEntry | null = traceTime
    ? {
        id: "relance-traced",
        state: "traced",
        prefix: `Relance ${data.nextRelance} · tracée le`,
        date: traceTime.date,
        time: traceTime.time,
      }
    : null;
  const history = dynamicEntry
    ? data.replaceHistoryIndex === undefined
      ? [...data.history, dynamicEntry]
      : data.history.map((entry, index) =>
          index === data.replaceHistoryIndex ? dynamicEntry : entry,
        )
    : data.history;
  const actionLabel =
    phase === "working"
      ? "Écriture de la trace"
      : phase === "done"
        ? "Relance tracée"
        : phase === "failed"
          ? "Réessayer"
          : "Envoyer la relance";

  return (
    <article
      aria-labelledby={`product-client-${data.id}`}
      className="product-row"
      role="listitem"
    >
      <div className="product-row__identity">
        <span aria-hidden="true" className="product-row__initials">
          {data.initials}
        </span>
        <div className="product-row__client-copy">
          <h4 className="product-row__client" id={`product-client-${data.id}`}>
            {data.client}
          </h4>
          <p className="product-row__reference mono">
            <span>{data.reference}</span>
            <span aria-hidden="true"> · </span>
            <span>échue {data.dueDate}</span>
          </p>
        </div>
      </div>

      <ul
        aria-label={`Historique des relances pour ${data.client}`}
        aria-live="polite"
        aria-relevant="additions text"
        className="product-row__history"
      >
        {history.map((entry) => (
          <li className="product-row__history-entry" data-state={entry.state} key={entry.id}>
            <span aria-hidden="true" className="product-row__history-dot" />
            <span>
              <HistoryEntryView entry={entry} />
            </span>
          </li>
        ))}
      </ul>

      <StatusBadge className="product-row__overdue" variant="butter">
        <span>Retard</span>
        <span className="mono">{data.overdueDays}</span>
        <span>j</span>
      </StatusBadge>

      <p className="product-row__amount mono">
        {data.amount}
      </p>

      <div className="product-row__action">
        <Button
          aria-describedby="product-hold-help"
          className="product-row__send"
          fullWidth
          holdToConfirm={oryzeTokens.motion.holdMs}
          onHoldCancel={() =>
            setAnnouncement("Maintien annulé. La relance n'a pas été envoyée.")
          }
          onHoldComplete={() => {
            setProgress(0);
            setAnnouncement("Maintien terminé. La démonstration écrit la trace, sans envoyer de message.");
            setPhase("working");
          }}
          phase={phase}
          size="md"
          type="button"
          variant="primary"
        >
          {actionLabel}
        </Button>
      </div>

      {phase === "working" ? (
        <div className="product-row__progress">
          <span className="product-row__progress-label">Écriture de la trace</span>
          <span
            aria-label="Progression de l'écriture de la trace"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.floor(progress * 100)}
            className="product-row__progress-track"
            role="progressbar"
          >
            <span className="product-row__progress-fill" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="product-row__progress-value mono">{Math.round(progress * 100)}%</span>
        </div>
      ) : null}

      {phase === "done" ? (
        <p className="product-row__confirmation">
          Relance {data.nextRelance} · tracée · démonstration locale
        </p>
      ) : null}
      <p aria-live="polite" className="visually-hidden" role="status">
        {announcement}
      </p>
    </article>
  );
}

export function ProductApplication() {
  return (
    <div className="product-application">
      <div aria-labelledby="product-screen-title" className="product-screen" role="group">
        <header className="product-screen__header">
          <h3 className="product-screen__title" id="product-screen-title">
            Relances clients
          </h3>
          <span className="product-screen__account mono">Compte pro · •••• 4827</span>
        </header>

        <div className="product-screen__content">
          <p className="product-screen__eyebrow mono">EN RETARD</p>
          <div aria-label="Factures en retard" className="product-row-list" role="list">
            {productRelances.map((relance) => (
              <ProductRelanceRow data={relance} key={relance.id} />
            ))}
          </div>
          <p className="product-screen__hold-help" id="product-hold-help">
            Maintenir une seconde · relâcher avant la fin annule
          </p>
          <p className="product-screen__note mono">
            Démonstration locale · aucune relance réelle n'est envoyée
          </p>
        </div>
      </div>

      <ul aria-label="Six surfaces réelles" className="product-context-grid">
        {productContexts.map(({ context, label }) => (
          <li className="product-context" key={context}>
            <p className="product-context__caption mono">{context}</p>
            <Button
              className="product-context__button"
              fullWidth
              size="md"
              type="button"
              variant="primary"
            >
              {label}
            </Button>
          </li>
        ))}
      </ul>

      <p className="product-context-line">
        Un seul composant. Six surfaces réelles. Aucune dérive.
      </p>
    </div>
  );
}
