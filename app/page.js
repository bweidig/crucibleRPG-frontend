"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.2 + 0.03,
    }))
  );

  return (
    <div className={styles.particleField}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            "--p-opacity": p.opacity,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function PasswordModal({ onClose, onSuccess }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const PASSCODE = "crucible2026";

  const handleSubmit = () => {
    if (value === PASSCODE) {
      onSuccess();
    } else {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
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
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 150);
  }, []);

  const handleEmailSubmit = () => {
    if (email && email.includes("@")) {
      setSubmitted(true);
    }
  };

  if (authenticated) {
    return (
      <div className={styles.authContainer}>
        <ParticleField />
        <div className={styles.authContent}>
          <div className={styles.authWelcome}>Welcome back.</div>
          <div className={styles.authRedirect}>
            Redirecting to auth page...
          </div>
          <div className={styles.authNote}>
            (In production, this navigates to /auth)
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
                >
                  JOIN THE WAITLIST
                </button>
              </div>
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
