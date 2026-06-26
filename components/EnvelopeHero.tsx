"use client";

import { useEffect, useState } from "react";

type EnvelopePhase = "closed" | "opening" | "open";

interface EnvelopeHeroProps {
  phase: EnvelopePhase;
  /** Overlay intro — small envelope, minimal text */
  compact?: boolean;
  /** Landing hero — envelope animation only, no letter text */
  decorative?: boolean;
}

export function EnvelopeHero({
  phase,
  compact = false,
  decorative = false,
}: EnvelopeHeroProps) {
  const isOpen = phase === "open";
  const isOpening = phase === "opening" || isOpen;
  const showLetterText = !decorative;

  return (
    <div
      className={`envelope-scene ${compact ? "envelope-scene--compact" : ""} ${decorative ? "envelope-scene--decorative" : ""} ${isOpening ? "envelope-scene--opening" : ""} ${isOpen ? "envelope-scene--open" : ""}`}
      aria-hidden={decorative || compact ? true : undefined}
    >
      <div className="envelope-3d">
        <div className="envelope-back" />
        <div className="envelope-side envelope-side--left" />
        <div className="envelope-side envelope-side--right" />

        <div className="envelope-letter">
          <div className="envelope-letter-inner">
            {showLetterText && (
              <>
                <div className="hero-arabic hero-arabic--animated">بريد</div>
                <h1 className="hero-title--animated">Barid</h1>
                {!compact && (
                  <>
                    <p className="subtitle subtitle--animated">
                      A daily letter to your phone — news &amp; Islamic updates, personally written for you.
                    </p>
                    <div className="hero-divider hero-divider--animated" aria-hidden="true">
                      <span className="hero-divider-line" />
                      <span className="hero-divider-icon">◆ ◆ ◆</span>
                      <span className="hero-divider-line" />
                    </div>
                  </>
                )}
              </>
            )}
            {decorative && (
              <div className="envelope-letter-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </div>

        <div className="envelope-pocket" />

        <div className="envelope-flap-top">
          <div className="envelope-flap-top-face" />
        </div>

        <div className="envelope-stamp envelope-stamp--animated">
          <span className="envelope-stamp-inner">ب</span>
        </div>

        <div className="envelope-seal" aria-hidden="true" />
      </div>
    </div>
  );
}

interface OpeningOverlayProps {
  onComplete: () => void;
}

export function OpeningOverlay({ onComplete }: OpeningOverlayProps) {
  const [phase, setPhase] = useState<EnvelopePhase>("closed");

  useEffect(() => {
    const openTimer = window.setTimeout(() => setPhase("opening"), 400);
    const doneTimer = window.setTimeout(() => {
      setPhase("open");
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="opening-overlay" role="status" aria-label="Opening your post">
      <EnvelopeHero phase={phase} compact />
      <p className="opening-overlay-text">
        {phase === "closed" ? "Delivering your post…" : "Opening…"}
      </p>
    </div>
  );
}
