"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => {
      const color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
      const size = Math.random() * 3.0 + 0.6;
      const opacity = Math.random() * 0.30 + 0.06;
      const floatDur = Math.random() * 14 + 6;
      const floatDelay = Math.random() * 10;
      const hasTwinkle = Math.random() < 0.4;
      const twinkleDur = Math.random() * 3 + 1.5;
      const twinkleDelay = Math.random() * 6;
      return {
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size, color, opacity, floatDur, floatDelay,
        hasTwinkle, twinkleDur, twinkleDelay,
        blur: size > 2.5,
      };
    })
  );

  return (
    <div className={styles.particleField}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          '--p-opacity': p.opacity, opacity: p.opacity,
          animation: `float ${p.floatDur}s ease-in-out ${p.floatDelay}s infinite${p.hasTwinkle ? `, twinkle ${p.twinkleDur}s ease-in-out ${p.twinkleDelay}s infinite` : ''}`,
          filter: p.blur ? 'blur(0.5px)' : 'none',
        }} />
      ))}
    </div>
  );
}

function PasswordModal({ onClose, onSuccess }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async () => {
    if (!value || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/auth-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setShake(true);
        setValue("");
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${shake ? styles.modalShake : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
          placeholder="••••••••"
          className={styles.passwordInput}
        />
        <button onClick={handleSubmit} className={styles.enterBtn}>
          ENTER
        </button>
      </div>
    </div>
  );
}

export default function ComingSoon() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 150);
  }, []);

  useEffect(() => {
    if (authenticated) {
      router.push("/landing");
    }
  }, [authenticated, router]);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@") || submitting) return;
    setEmailError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setEmailError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authenticated) {
    return (
      <div className={styles.authContainer}>
        <ParticleField />
        <div className={styles.authContent}>
          <div className={styles.authWelcome}>Welcome back.</div>
          <div className={styles.authRedirect}>
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ParticleField />

      {showPassword && (
        <PasswordModal
          onClose={() => setShowPassword(false)}
          onSuccess={() => {
            setShowPassword(false);
            setAuthenticated(true);
          }}
        />
      )}

      <div className={styles.mainContent}>
        {/* Subtle glow behind content */}
        <div className={styles.glow} />

        {/* Wordmark */}
        <div
          className={styles.wordmark}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className={styles.wordmarkCrucible}>CRUCIBLE</div>
          <div className={styles.wordmarkRpg}>RPG</div>
        </div>

        {/* Headline */}
        <h1
          className={styles.headline}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(16px)",
          }}
        >
          A new kind of adventure is coming.
        </h1>

        {/* Subline */}
        <p
          className={styles.subline}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(16px)",
          }}
        >
          A tabletop RPG powered by AI. Real mechanics. Real consequences. No
          group required.
        </p>

        {/* Body */}
        <p
          className={styles.body}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(16px)",
          }}
        >
          A solo RPG experience with a living world, server-side rules, and an
          AI storyteller that remembers everything you do. No dice apps. No prep
          time. Just your choices and their consequences.
        </p>

        {/* Email signup */}
        <div
          className={styles.signupSection}
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(16px)",
          }}
        >
          {!submitted ? (
            <>
              <div className={styles.signupLabel}>
                GET NOTIFIED WHEN WE LAUNCH
              </div>
              <div className={styles.signupRow}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="your@email.com"
                  className={styles.emailInput}
                />
                <button
                  className={styles.waitlistBtn}
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                >
                  {submitting ? "JOINING..." : "JOIN THE WAITLIST"}
                </button>
              </div>
              {emailError && (
                <div className={styles.errorMsg}>{emailError}</div>
              )}
            </>
          ) : (
            <div className={styles.successMsg}>
              You&apos;re on the list. We&apos;ll let you know when the gates open.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          &copy; 2026 CrucibleRPG &middot; Every hero needs a crucible.
        </span>
      </footer>

      {/* Hidden hotspot — bottom right corner */}
      <div
        className={styles.hotspot}
        onClick={() => setShowPassword(true)}
      />
    </div>
  );
}
