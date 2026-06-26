"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EnvelopeHero, OpeningOverlay } from "@/components/EnvelopeHero";
import {
  INTEREST_OPTIONS,
  SMS_MAX_CHARS,
  type InterestId,
  type UserSettings,
} from "@/lib/types";
import { DELIVERY_WINDOW_LABEL } from "@/lib/delivery-time";

const STEPS = [
  { id: 1, label: "Delivery" },
  { id: 2, label: "Contents" },
  { id: 3, label: "Dispatch" },
] as const;

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      <span className="card-corner card-corner--tl" aria-hidden="true" />
      <span className="card-corner card-corner--br" aria-hidden="true" />
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function interestLabel(id: InterestId): string {
  return INTEREST_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export default function SetupPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [interests, setInterests] = useState<InterestId[]>(["news", "islamic"]);
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);
  const [heroOpen, setHeroOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data: UserSettings = await res.json();
      setSettings(data);
      setPhoneNumber(data.phoneNumber);
      setInterests(data.interests);
    } catch {
      setStatus({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!showOverlay && !pageVisible) {
      setPageVisible(true);
      setHeroOpen(true);
    }
  }, [showOverlay, pageVisible]);

  function goTo(nextStep: number) {
    setSlideDir(nextStep > step ? "forward" : "back");
    setStep(nextStep);
    setStatus(null);
  }

  function toggleInterest(id: InterestId) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleNext() {
    if (step === 1) {
      if (!phoneNumber.trim()) {
        setStatus({ type: "error", text: "Please enter your phone number." });
        return;
      }
      goTo(2);
      return;
    }
    if (step === 2) {
      if (interests.length === 0) {
        setStatus({ type: "error", text: "Choose at least one topic for your letter." });
        return;
      }
      goTo(3);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          interests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSettings(data);
      setStatus({
        type: "success",
        text: `You're subscribed! Your daily letter arrives each morning (${DELIVERY_WINDOW_LABEL}).`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Test failed");
      setStatus({
        type: "success",
        text: `Test sent (${data.message.length}/${SMS_MAX_CHARS} chars): "${data.message}"`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  }

  const subscribed = Boolean(settings?.phoneNumber && settings.phoneNumber === phoneNumber);

  const heroPhase = heroOpen ? "open" : "closed";
  const slideClass = slideDir === "forward" ? "step-panel--enter-forward" : "step-panel--enter-back";

  return (
    <>
      {loading && (
        <div className="opening-overlay opening-overlay--loading" role="status">
          <EnvelopeHero phase="closed" compact />
          <p className="opening-overlay-text">Delivering your post…</p>
        </div>
      )}

      {!loading && showOverlay && (
        <OpeningOverlay onComplete={() => setShowOverlay(false)} />
      )}

      <header className="setup-topbar">
        <Link href="/" className="setup-back-link">
          ← Back to home
        </Link>
      </header>

      <main className={`main-content ${pageVisible ? "main-content--visible" : ""}`}>
        <header className="hero hero--animated">
          <EnvelopeHero phase={heroPhase} />
        </header>

        <nav className="step-nav" aria-label="Setup progress">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`step-nav-item ${step === s.id ? "step-nav-item--active" : ""} ${step > s.id ? "step-nav-item--done" : ""}`}
              onClick={() => {
                if (s.id < step) goTo(s.id);
              }}
              disabled={s.id > step}
              aria-current={step === s.id ? "step" : undefined}
            >
              <span className="step-nav-dot">{s.id}</span>
              <span className="step-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="step-container">
          {step === 1 && (
            <div className={`step-panel ${slideClass}`} key="step-1">
              <Card title="Delivery Address">
                <label htmlFor="phone">Your phone number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="field-hint">
                  Include country code — where your daily letter arrives
                </p>

                <p className="delivery-window-note">
                  <strong>When it arrives:</strong> every morning at {DELIVERY_WINDOW_LABEL}{" "}
                  (Central).
                </p>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className={`step-panel ${slideClass}`} key="step-2">
              <Card title="Letter Contents">
                <p className="section-intro">
                  Choose what your daily letter covers. One text per day — max {SMS_MAX_CHARS}{" "}
                  characters to keep costs low.
                </p>
                <div className="checkbox-group">
                  {INTEREST_OPTIONS.map((opt) => (
                    <label key={opt.id} className="checkbox-item checkbox-item--rich">
                      <input
                        type="checkbox"
                        checked={interests.includes(opt.id)}
                        onChange={() => toggleInterest(opt.id)}
                      />
                      <span className="checkbox-item-text">
                        <strong>{opt.label}</strong>
                        <small>{opt.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className={`step-panel ${slideClass}`} key="step-3">
              <Card title="Review Your Letter">
                <dl className="review-list">
                  <div className="review-row">
                    <dt>Phone</dt>
                    <dd>{phoneNumber || "—"}</dd>
                  </div>
                  <div className="review-row">
                    <dt>Delivery</dt>
                    <dd>{DELIVERY_WINDOW_LABEL}</dd>
                  </div>
                  <div className="review-row">
                    <dt>Topics</dt>
                    <dd>{interests.map(interestLabel).join(", ")}</dd>
                  </div>
                  <div className="review-row">
                    <dt>Format</dt>
                    <dd>1 SMS per day ({SMS_MAX_CHARS} chars max)</dd>
                  </div>
                </dl>
              </Card>

              <div className="actions actions--step">
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || interests.length === 0}
                >
                  {saving ? "Sealing…" : "Seal & Save"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleTest}
                  disabled={testing || !phoneNumber}
                >
                  {testing ? "Dispatching…" : "Send Test Letter"}
                </button>
              </div>

              {settings?.lastSentAt && (
                <p className="last-sent">
                  Last letter sent: {new Date(settings.lastSentAt).toLocaleString()}
                </p>
              )}

              <div className="delivery-info">
                <strong>Daily delivery — automatic</strong>
                <p>
                  {subscribed ? (
                    <>
                      You&apos;re subscribed. Barid sends one letter at{" "}
                      <strong>{DELIVERY_WINDOW_LABEL}</strong> each morning — no other sites
                      or setup required.
                    </>
                  ) : (
                    <>
                      Tap <strong>Seal &amp; Save</strong> to subscribe. Your letter is sent
                      at <strong>{DELIVERY_WINDOW_LABEL}</strong> each morning — no extra
                      accounts to configure.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {status && (
          <div className={`status status--animated ${status.type}`}>{status.text}</div>
        )}

        {step < 3 && (
          <div className="step-actions">
            {step > 1 && (
              <button type="button" className="btn-secondary" onClick={() => goTo(step - 1)}>
                Back
              </button>
            )}
            <button type="button" className="btn-primary" onClick={handleNext}>
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-actions">
            <button type="button" className="btn-secondary" onClick={() => goTo(2)}>
              Back
            </button>
          </div>
        )}
      </main>
    </>
  );
}
