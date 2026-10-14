"use client";

import { useEffect, useState } from "react";
import { Button, type ButtonPhase } from "@/components/ui/Button";
import { OryzeRing } from "@/components/ui/OryzeRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { oryzeTokens } from "@/lib/tokens";

export function MobileFrame() {
  const [phase, setPhase] = useState<ButtonPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (phase !== "working") return;

    const startedAt = performance.now();
    let frame = 0;
    const drawTrace = (now: number) => {
      const next = Math.min(1, (now - startedAt) / oryzeTokens.interaction.simulatedSendMs);
      setProgress(next);
      if (next >= 1) {
        setPhase("done");
        setAnnouncement("La trace a été ajoutée à la démonstration. Aucun message n'a été envoyé.");
        return;
      }
      frame = window.requestAnimationFrame(drawTrace);
    };

    frame = window.requestAnimationFrame(drawTrace);
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const beginSending = () => {
    setProgress(0);
    setAnnouncement("Maintien terminé. Écriture de la trace dans cette démonstration.");
    setPhase("working");
  };

  const actionLabel =
    phase === "working"
      ? "Écriture de la trace"
      : phase === "done"
        ? "Relance tracée"
        : "Envoyer la relance";

  return (
    <figure className="phone-figure">
      <div className="phone-frame">
        <div className="phone-frame__speaker" aria-hidden="true" />
        <div className="phone-screen">
          <div className="phone-screen__statusbar">
            <span className="mono">09:12</span>
            <span aria-hidden="true" className="phone-screen__status-mark">
              <span />
              <span />
              <span />
            </span>
          </div>

          <header className="phone-app-header">
            <div className="phone-app-header__line">
              <span className="phone-app-header__brand">
                <OryzeRing progress={1} size={17} variant="full" />
                RELANCES
              </span>
              <span className="phone-app-header__count mono">01</span>
            </div>
            <h3>Studio Nord</h3>
            <p>Une relance préparée</p>
          </header>

          <div className="phone-content">
            <div className="phone-invoice">
              <div className="phone-invoice__top">
                <span className="mono">FAC-2026-0038</span>
                <StatusBadge variant="butter">Retard 12 jours</StatusBadge>
              </div>
              <p className="phone-invoice__due">
                échue le <span className="mono">02/08</span>
              </p>
              <p className="phone-invoice__amount mono">860,00 €</p>
            </div>

            <div className="phone-prepared">
              <p className="phone-prepared__label">RELANCE 2 · PRÉPARÉE</p>
              <p className="phone-prepared__copy">
                « Sauf erreur de notre part, la facture… »
              </p>
              <p className="phone-prepared__source">Oryze Intelligence</p>
            </div>
          </div>

          <div className="phone-action">
            <Button
              aria-describedby="phone-hold-instruction"
              className="phone-action__button"
              fullWidth
              holdToConfirm={oryzeTokens.motion.holdMs}
              onHoldCancel={() => setAnnouncement("Maintien annulé. Rien n'a été envoyé.")}
              onHoldComplete={beginSending}
              phase={phase}
              size="sm"
              type="button"
              variant="primary"
            >
              {actionLabel}
            </Button>
            <p className="phone-action__instruction" id="phone-hold-instruction">
              Maintenir · relâcher annule
            </p>
            <div className={`phone-trace${phase === "working" ? " phone-trace--active" : ""}`}>
              <span aria-live="polite" className="phone-trace__label">
                {phase === "working" ? "Trace en cours" : phase === "done" ? "Trace écrite" : " "}
              </span>
              <span aria-hidden="true" className="phone-trace__track">
                <span style={{ width: `${progress * 100}%` }} />
              </span>
              <span className="phone-trace__percent mono">
                {phase === "working" ? `${Math.round(progress * 100)}%` : phase === "done" ? "100%" : ""}
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="phone-screen__home-indicator" />
        </div>
      </div>
      <figcaption className="phone-figure__caption">
        Même geste, réduit au pouce · <span className="mono">0,9 s</span> au toucher
      </figcaption>
      <p aria-live="polite" className="visually-hidden" role="status">
        {announcement}
      </p>
    </figure>
  );
}
