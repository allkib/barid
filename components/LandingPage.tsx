"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroDeliveryVisual } from "@/components/HeroDeliveryVisual";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SMS_MAX_CHARS } from "@/lib/types";

const FEATURES = [
  {
    icon: "◈",
    title: "Middle East News",
    text: "Latest headlines from Al Jazeera, BBC Middle East, and other reliable sources — what's happening in the region right now.",
  },
  {
    icon: "☪",
    title: "Islamic Calendar",
    text: "Today's Hijri date, upcoming holidays, and traditions worth knowing — Ramadan, Eid, Ashura, and more.",
  },
  {
    icon: "✉",
    title: "One Letter Daily",
    text: `Exactly one SMS per day, capped at ${SMS_MAX_CHARS} characters. No spam, no clutter — just your morning post.`,
  },
  {
    icon: "✦",
    title: "AI-Personalized",
    text: "Written fresh each morning by AI — warm, concise, and tailored to the topics you choose.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Set your address",
    text: "Enter your phone number and pick when you'd like your letter each morning.",
  },
  {
    num: "02",
    title: "Choose your contents",
    text: "Select Middle East news, Islamic calendar updates, or both.",
  },
  {
    num: "03",
    title: "Receive your post",
    text: "Every day at your chosen time, one thoughtful text arrives in your inbox.",
  },
];

const SAMPLE_SMS =
  "Good morning. Al Jazeera reports renewed ceasefire talks in Gaza. Today is 26 Ramadan 1447 AH — Laylat al-Qadr approaches. May your day be peaceful.";

function BrandMark({ size = "nav" }: { size?: "nav" | "footer" }) {
  return (
    <span className={`brand-mark brand-mark--${size}`}>
      <span className="brand-mark-arabic">بريد</span>
      <span className="brand-mark-en">Barid</span>
    </span>
  );
}

export function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className={`landing ${visible ? "landing--visible" : ""}`}>
      <header className="landing-nav">
        <Link href="/" className="landing-logo">
          <BrandMark size="nav" />
        </Link>
        <nav className="landing-nav-links" aria-label="Main">
          <a href="#concept">Concept</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <Link href="/setup" className="landing-btn landing-btn--primary landing-nav-cta">
          Get started
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow landing-fade" style={{ animationDelay: "0.1s" }}>
              Arabic for &ldquo;mail&rdquo; — your morning post, by text
            </p>
            <h1 className="landing-title landing-fade" style={{ animationDelay: "0.2s" }}>
              Your daily letter,
              <em> delivered by text</em>
            </h1>
            <p className="landing-lead landing-fade" style={{ animationDelay: "0.35s" }}>
              Barid sends you one personalized SMS each morning — Middle East news from
              trusted sources and Islamic calendar reminders, written for you like a letter
              from a thoughtful friend.
            </p>
            <div className="landing-hero-actions landing-fade" style={{ animationDelay: "0.5s" }}>
              <Link href="/setup" className="landing-btn landing-btn--primary">
                Start your daily post
              </Link>
              <a href="#concept" className="landing-btn landing-btn--secondary">
                Learn more
              </a>
            </div>
            <p className="landing-hero-note landing-fade" style={{ animationDelay: "0.65s" }}>
              Free to set up · One text per day · {SMS_MAX_CHARS} characters max
            </p>
          </div>
          <div className="landing-hero-visual landing-fade" style={{ animationDelay: "0.4s" }}>
            <HeroDeliveryVisual message={SAMPLE_SMS} />
          </div>
        </div>
        <div className="landing-hero-divider landing-fade" style={{ animationDelay: "0.75s" }} aria-hidden="true">
          <span>◆ ◆ ◆</span>
        </div>
      </section>

      <section id="concept" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-concept-grid">
            <div>
              <ScrollReveal>
                <h2 className="landing-section-title">A letter, not a feed</h2>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <p className="landing-body">
                  In a world of endless notifications, Barid brings back something older and
                  calmer: <strong>one letter a day</strong>. No app to open, no algorithm to
                  fight — just a single text waiting for you each morning.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="landing-body">
                  The name <span className="landing-arabic-inline">بريد</span> (Barid) means
                  mail or post in Arabic. Each message is composed overnight from live news
                  headlines and the Islamic calendar, then sealed and sent to your phone at
                  the time you choose.
                </p>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={150}>
              <blockquote className="landing-pullquote">
                <p>
                  &ldquo;Like receiving a postcard from someone who reads the news for you
                  and remembers what matters in the Islamic year.&rdquo;
                </p>
              </blockquote>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section landing-section--alt">
        <div className="landing-section-inner">
          <ScrollReveal>
            <h2 className="landing-section-title landing-section-title--center">
              What&apos;s in your letter
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <p className="landing-section-sub landing-section-sub--center">
              Two topics, one message — woven together naturally.
            </p>
          </ScrollReveal>
          <div className="landing-features">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 100} className="landing-feature-reveal">
                <article className="landing-feature-card">
                  <span className="landing-feature-icon">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section">
        <div className="landing-section-inner">
          <ScrollReveal>
            <h2 className="landing-section-title landing-section-title--center">
              How it works
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <p className="landing-section-sub landing-section-sub--center">
              Three steps to your first letter.
            </p>
          </ScrollReveal>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 120} className="landing-step-reveal">
                <div className="landing-step">
                  <span className="landing-step-num">{s.num}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="landing-cta-banner">
          <div className="landing-cta-inner">
            <h2>Ready for your morning post?</h2>
            <p>Set up takes less than two minutes. No app download required.</p>
            <Link href="/setup" className="landing-btn landing-btn--primary landing-btn--on-dark">
              Open your envelope
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <footer className="landing-footer">
          <BrandMark size="footer" />
          <span className="landing-footer-text">Daily letters by SMS</span>
          <Link href="/setup" className="landing-footer-link">Get started</Link>
        </footer>
      </ScrollReveal>
    </div>
  );
}
