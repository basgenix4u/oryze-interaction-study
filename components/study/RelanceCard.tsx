"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button, type ButtonPhase } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TraceLog, type TraceEntry } from "@/components/study/TraceLog";
import { oryzeTokens } from "@/lib/tokens";

const initialMessage =
  "Bonjour Monsieur Roux,\n\nSauf erreur de notre part, la facture FAC-2026-0038 du 02/07, d'un montant de 860,00\u202f€, reste à régler. Elle est échue depuis le 02/08.\n\nSi le règlement a déjà été effectué, merci d'ignorer ce message. Dans le cas contraire, pourriez-vous nous indiquer la date de règlement prévue\u202f?\n\nBien cordialement,\nStudio Lumen";

const numericTokenPattern = /(FAC-\d{4}-\d{4}|\d{2}\/\d{2}|\d+(?:[ \u202f\u00a0]\d{3})*,\d{2}[ \u202f\u00a0]?€)/g;
const numericTokenTest = /^(?:FAC-\d{4}-\d{4}|\d{2}\/\d{2}|\d+(?:[ \u202f\u00a0]\d{3})*,\d{2}[ \u202f\u00a0]?€)$/;

function FormattedMessage({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");

  return (
    <div className="message-copy">
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split("\n");
        return (
          <p className="message-copy__paragraph" key={`paragraph-${paragraphIndex}`}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`line-${paragraphIndex}-${lineIndex}`}>
                {line.split(numericTokenPattern).map((part, partIndex) =>
                  numericTokenTest.test(part) ? (
                    <span className="mono" key={`token-${paragraphIndex}-${lineIndex}-${partIndex}`}>
                      {part}
                    </span>
                  ) : (
                    <Fragment key={`text-${paragraphIndex}-${lineIndex}-${partIndex}`}>{part}</Fragment>
                  ),
                )}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function getLocalTraceTime(): { date: string; time: string; id: string } {
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

  return { date, time, id: `relance-2-${now.getTime()}` };
}

export function RelanceCard() {
  const [phase, setPhase] = useState<ButtonPhase>("idle");
  const [sendProgress, setSendProgress] = useState(0);
  const [newEntry, setNewEntry] = useState<TraceEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [draft, setDraft] = useState(initialMessage);
  const [announcement, setAnnouncement] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreEditorFocusRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      editorRef.current?.focus();
    } else if (restoreEditorFocusRef.current) {
      editTriggerRef.current?.focus();
      restoreEditorFocusRef.current = false;
    }
  }, [isEditing]);

  useEffect(() => {
    if (phase !== "working") return;

    const startedAt = performance.now();
    let frame = 0;
    const drawTrace = (now: number) => {
      const next = Math.min(1, (now - startedAt) / oryzeTokens.interaction.simulatedSendMs);
      setSendProgress(next);

      if (next >= 1) {
        const stamp = getLocalTraceTime();
        setNewEntry({
          id: stamp.id,
          label: "Relance 2 · tracée",
          date: stamp.date,
          time: stamp.time,
          state: "traced",
          isNew: true,
        });
        setPhase("done");
        setAnnouncement(`Trace ajoutée à l'historique, le ${stamp.date} à ${stamp.time}. Aucune relance réelle n'a été envoyée.`);
        return;
      }

      frame = window.requestAnimationFrame(drawTrace);
    };

    frame = window.requestAnimationFrame(drawTrace);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const beginSending = () => {
    setSendProgress(0);
    setAnnouncement("Maintien terminé. La démonstration écrit la trace, sans envoyer de message.");
    setPhase("working");
  };

  const cancelSending = () => {
    setAnnouncement("Maintien annulé. La relance n'a pas été envoyée.");
  };

  const openEditor = () => {
    setDraft(message);
    setIsEditing(true);
  };

  const saveDraft = () => {
    setMessage(draft);
    restoreEditorFocusRef.current = true;
    setIsEditing(false);
    setAnnouncement("Le texte modifié est conservé dans cette démonstration.");
  };

  const cancelDraft = () => {
    setDraft(message);
    restoreEditorFocusRef.current = true;
    setIsEditing(false);
  };

  const actionLabel =
    phase === "working"
      ? "Écriture de la trace"
      : phase === "done"
        ? "Relance tracée"
        : phase === "failed"
          ? "Réessayer"
          : "Envoyer la relance";
  const isFinal = phase === "done";

  return (
    <article aria-label="Relance préparée pour Studio Nord" className="relance-card">
      <header className="relance-card__header">
        <div className="relance-card__client">
          <p className="card-overline">11:40 <span aria-hidden="true">·</span> ALERTES</p>
          <h2 className="relance-card__name">Studio Nord</h2>
          <p className="relance-card__reference">
            <span className="mono">FAC-2026-0038</span>
            <span aria-hidden="true"> · </span>
            échue le <span className="mono">02/08</span>
          </p>
        </div>
        <div className="relance-card__amount-block">
          <p className="relance-card__amount">860,00 €</p>
          <StatusBadge variant="butter">Retard 12 jours</StatusBadge>
        </div>
      </header>

      <div className="prepared-message">
        <p className="prepared-message__label">
          <span aria-hidden="true" className="prepared-message__dot" />
          Relance 2 · préparée par Oryze Intelligence
        </p>

        {isEditing ? null : <FormattedMessage text={message} />}
        <label className="message-editor-label" htmlFor="relance-message-editor" hidden={!isEditing}>
          Texte de la relance
          <textarea
            className="message-editor"
            id="relance-message-editor"
            onChange={(event) => setDraft(event.currentTarget.value)}
            ref={editorRef}
            rows={8}
            value={draft}
          />
        </label>
      </div>

      <div className="relance-card__actions">
        <Button
          aria-describedby="hold-instruction"
          className="send-button"
          disabled={isEditing}
          fullWidth
          holdToConfirm={oryzeTokens.motion.holdMs}
          onHoldCancel={cancelSending}
          onHoldComplete={beginSending}
          phase={phase}
          size="lg"
          type="button"
          variant="primary"
        >
          {actionLabel}
        </Button>
        <p className="hold-instruction" id="hold-instruction">
          Maintenir une seconde · relâcher avant la fin annule
        </p>

        <div aria-hidden={phase !== "working"} className={`trace-progress${phase === "working" ? " trace-progress--active" : ""}`}>
          <span aria-live="polite" className="trace-progress__label">
            {phase === "working" ? "Écriture de la trace" : "Trace en attente"}
          </span>
          <span
            aria-label="Progression de l'écriture de la trace"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.floor((sendProgress * 100) / 10) * 10}
            className="trace-progress__track"
            role="progressbar"
          >
            <span className="trace-progress__fill" style={{ width: `${sendProgress * 100}%` }} />
          </span>
          <span className="trace-progress__value mono">{Math.round(sendProgress * 100)}%</span>
        </div>

        <div className="relance-card__secondary-actions">
          <Button
            aria-controls="relance-message-editor"
            aria-expanded={isEditing}
            disabled={phase === "working" || isFinal || isEditing}
            onClick={openEditor}
            ref={editTriggerRef}
            size="sm"
            variant="ghost"
          >
            Modifier le texte
          </Button>
          {isEditing ? (
            <>
              <Button onClick={saveDraft} size="sm" variant="ghost">
                Enregistrer le texte
              </Button>
              <Button onClick={cancelDraft} size="sm" variant="ghost">
                Annuler
              </Button>
            </>
          ) : null}
          {isFinal ? <span className="send-confirmation">Trace écrite · démonstration locale</span> : null}
        </div>

        <TraceLog newEntry={newEntry} />
        <p className="card-provenance mono">
          relance-retard-v1.0 · calculé le 08/08/2026 11:40 · données → 08/08
        </p>
      </div>
      <p aria-live="polite" className="visually-hidden" role="status">
        {announcement}
      </p>
    </article>
  );
}
