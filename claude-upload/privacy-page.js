'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import ClientFadeIn from '@/components/ClientFadeIn';
import styles from './page.module.css';

const SETTINGS_KEY = 'crucible_display_settings';
const SIZE_MAP = { small: '13px', medium: '16px', large: '17px', xlarge: '19px' };

function loadDisplaySettings() {
  if (typeof window === 'undefined') return { font: 'alegreya', textSize: 'medium' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { font: parsed.font || 'alegreya', textSize: parsed.textSize || 'medium' };
    }
  } catch {}
  return { font: 'alegreya', textSize: 'medium' };
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: 'var(--font-cinzel)',
        fontSize: 'clamp(16px, 2vw, 19px)',
        fontWeight: 700,
        color: 'var(--text-heading)',
        letterSpacing: '0.03em',
        marginBottom: 16,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border-primary)',
      }}>{title}</h2>
      <div style={{
        fontFamily: 'var(--font-alegreya-sans)',
        fontSize: 'var(--legal-body-size, 16px)',
        fontWeight: 400,
        color: 'var(--text-secondary)',
        lineHeight: 1.75,
      }}>
        {children}
      </div>
    </div>
  );
}

function LegalList({ items }) {
  return (
    <div style={{ margin: '12px 0 12px 4px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, marginBottom: 8,
          fontFamily: 'var(--font-alegreya-sans)',
          fontSize: 'var(--legal-body-size, 16px)', color: 'var(--text-secondary)', lineHeight: 1.75,
        }}>
          <span style={{ color: 'var(--gold-muted)', flexShrink: 0, marginTop: 1 }}>&middot;</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const [displaySettings, setDisplaySettings] = useState({ font: 'alegreya', textSize: 'medium' });

  useEffect(() => {
    setDisplaySettings(loadDisplaySettings());
    const handleChange = () => setDisplaySettings(loadDisplaySettings());
    window.addEventListener('display-settings-changed', handleChange);
    window.addEventListener('storage', (e) => { if (e.key === SETTINGS_KEY) handleChange(); });
    return () => {
      window.removeEventListener('display-settings-changed', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const isLexie = displaySettings.font === 'lexie';
  const containerVars = {
    '--legal-body-size': SIZE_MAP[displaySettings.textSize] || '16px',
    ...(isLexie ? { '--font-alegreya-sans': "'Lexie Readable', sans-serif" } : {}),
  };

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      position: 'relative', paddingTop: 72,
      ...containerVars,
    }}>
      <ParticleField />
      <NavBar />

      {/* Header */}
      <ClientFadeIn delay={0.15} style={{
        textAlign: 'center',
        padding: '48px 24px 40px',
        position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(26px, 3.5vw, 34px)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          letterSpacing: '0.04em',
          marginBottom: 12,
        }}>Privacy Policy</h1>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)',
          fontSize: 14,
          color: 'var(--gold-muted)',
        }}>Last updated: April 5, 2026</p>
      </ClientFadeIn>

      {/* Content */}
      <ClientFadeIn delay={0.35} translateY={0} style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '0 clamp(24px, 5vw, 48px) 64px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Intro */}
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)',
          fontSize: 'var(--legal-body-size, 16px)', fontWeight: 400,
          color: 'var(--text-secondary)', lineHeight: 1.75,
          marginBottom: 48,
        }}>
          This Privacy Policy explains how William Weidig (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) collects, uses, stores, and protects your information when you use CrucibleRPG. By creating an account or using the service, you agree to the practices described in this policy.
        </p>

        <Section title="Information We Collect">
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Account Information.</strong> When you create an account, we collect: your email address, a display name you choose, and a password (stored in hashed form — we never store or have access to your plaintext password). If you sign in with Google OAuth, we receive your email address and display name from Google. We do not request or receive your Google password.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Age Confirmation.</strong> During account creation, you confirm that you are 18 years of age or older. We do not collect your date of birth or any other age-related personal information beyond this confirmation.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Gameplay Data.</strong> When you play CrucibleRPG, we store: your character information (names, stats, inventory, skills, progression), world and campaign data (settings, NPCs, locations, factions, narrative history), game state (turn count, conditions, quest progress, save data), and the text you type as custom actions and character descriptions.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Payment Information.</strong> Payments are processed entirely by Stripe, Inc. We do not collect, store, process, or have access to your credit card number, bank account details, or other payment credentials. Stripe handles all payment data in accordance with PCI DSS standards. We receive from Stripe only: confirmation of successful payments, subscription status, and transaction identifiers necessary for billing support.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>Technical Information.</strong> We automatically collect limited technical information necessary to operate the service, including: IP address (for security and abuse prevention), browser type and device information (for compatibility), and server logs (request timestamps, error logs for debugging). We do not use tracking cookies, advertising pixels, or analytics services that profile your behavior across other websites. We do not serve advertisements. We do not sell, rent, or share your personal information with advertisers.</p>
        </Section>

        <Section title="How We Use Your Information">
          <p style={{ marginBottom: 12 }}>We use your information solely to: operate and provide the CrucibleRPG service, authenticate your account and maintain session security, process your payments through Stripe, store your game progress and campaign data, transmit gameplay data to AI providers (as described in the AI Provider Data Sharing section) to generate narrative content, diagnose technical issues and improve the service, communicate with you about your account or material changes to our policies, and comply with applicable legal requirements.</p>
          <p>We do not use your data for targeted advertising, behavioral profiling, or algorithmic content recommendations outside the game.</p>
        </Section>

        <Section title="AI Provider Data Sharing">
          <p style={{ marginBottom: 12 }}>CrucibleRPG uses third-party AI language model providers to generate narrative text during gameplay. This is a core function of the service. When you take an action in the game, the following data is transmitted to our AI provider (currently Google Gemini; other providers such as OpenAI or Anthropic may be used):</p>
          <LegalList items={[
            "Your character's current game state (stats, inventory, conditions, skills)",
            'Recent narrative context (a summary of recent game events, not your full history)',
            'The text of your current action or input',
            'World information (setting details, NPC data, location descriptions)',
            "System instructions that govern the AI's behavior and content boundaries",
          ]} />
          <p style={{ marginTop: 16, marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>What is NOT sent to AI providers:</strong> your email address, your password, your payment information, your IP address, or any account information that identifies you personally. The data sent to AI providers is gameplay content, not personal information.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>AI Provider Data Retention.</strong></p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: 'var(--text-heading)' }}>Google Gemini:</strong> Data sent through the paid API is not used by Google to train their foundation models. Google may temporarily store inputs and outputs for abuse monitoring purposes. See Google&rsquo;s Gemini API Terms of Service for current details.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: 'var(--text-heading)' }}>OpenAI:</strong> Data sent through the API is not used by OpenAI to train their models by default. See OpenAI&rsquo;s API Data Usage Policies for current details.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Anthropic:</strong> Data sent through the API is not used by Anthropic to train their models by default. See Anthropic&rsquo;s API Privacy Policy for current details.</p>
          <p>We select API tiers that do not use your gameplay data for model training. However, we do not control these providers&rsquo; internal data handling practices. We encourage you to review their respective privacy policies.</p>
        </Section>

        <Section title="Data Storage and Security">
          <p style={{ marginBottom: 12 }}>Your account and gameplay data is stored in a PostgreSQL database hosted on Railway (cloud infrastructure provider, US East region). Your frontend assets are served through Vercel.</p>
          <p style={{ marginBottom: 12 }}>We implement reasonable security measures to protect your data, including: hashed password storage (we cannot read your password), HTTPS encryption for all data in transit, database access restricted to authenticated server processes, and JWT-based session authentication.</p>
          <p>No system is perfectly secure. We cannot guarantee absolute security of your data. In the event of a data breach that compromises your personal information, we will notify affected users by email within 72 hours of discovery, in accordance with applicable state data breach notification laws.</p>
        </Section>

        <Section title="Data Retention">
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Active accounts:</strong> Your account information and gameplay data are retained for as long as your account is active.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Cancelled subscriptions:</strong> Your data is retained after cancellation so that you can resubscribe and resume your campaigns. We retain cancelled account data for up to 12 months.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Deleted accounts:</strong> When you request account deletion, we will delete your personal information (email, display name, hashed password) and gameplay data within 30 days. Some data may be retained in encrypted server backups for up to 90 days before being permanently purged.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>Server logs:</strong> Technical logs (IP addresses, error logs) are retained for up to 90 days for debugging and security purposes, then automatically deleted.</p>
        </Section>

        <Section title="Your Rights">
          <p style={{ marginBottom: 16 }}>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Access.</strong> You may request a copy of the personal information we hold about you.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Correction.</strong> You may request correction of inaccurate personal information.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Deletion.</strong> You may request deletion of your account and associated personal data. We will process deletion requests within 30 days.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Data Portability.</strong> You may request an export of your gameplay data in a machine-readable format.</p>
          <p style={{ marginBottom: 16 }}>To exercise any of these rights, contact us at <a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a>. We will verify your identity before processing requests.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Connecticut Residents.</strong> If you are a Connecticut resident, you have additional rights under the Connecticut Data Privacy Act (CTDPA), including the right to opt out of the sale of personal data (we do not sell personal data), the right to opt out of profiling in furtherance of automated decisions (we do not engage in such profiling), and the right to appeal a denied rights request by contacting us.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>California Residents.</strong> If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA). We do not sell or share your personal information as defined under these laws. For requests, contact us at <a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a>.</p>
        </Section>

        <Section title="Children&rsquo;s Privacy">
          <p>CrucibleRPG is intended solely for users aged 18 and older. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that a user is under 18, we will promptly terminate the account and delete all associated data. If you believe a minor has created an account, please contact us at <a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a>.</p>
        </Section>

        <Section title="International Users">
          <p>CrucibleRPG is operated from the United States. If you access the service from outside the United States, your data will be transferred to and processed in the United States. By using the service, you consent to this transfer. We do not currently offer localized data storage in other jurisdictions.</p>
        </Section>

        <Section title="Third-Party Services">
          <p style={{ marginBottom: 12 }}>CrucibleRPG integrates with the following third-party services. Each has its own privacy policy:</p>
          <LegalList items={[
            <span key="stripe">Stripe (payment processing) — <a className={styles.legalLink} href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></span>,
            <span key="google">Google (AI text generation via Gemini API, OAuth authentication) — <a className={styles.legalLink} href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></span>,
            <span key="openai">OpenAI (AI text generation) — <a className={styles.legalLink} href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">openai.com/policies/privacy-policy</a></span>,
            <span key="anthropic">Anthropic (AI text generation) — <a className={styles.legalLink} href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a></span>,
            <span key="railway">Railway (server and database hosting) — <a className={styles.legalLink} href="https://railway.com/legal/privacy" target="_blank" rel="noopener noreferrer">railway.com/legal/privacy</a></span>,
            <span key="vercel">Vercel (frontend hosting) — <a className={styles.legalLink} href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></span>,
          ]} />
          <p style={{ marginTop: 16 }}>We may add or change third-party providers as the service evolves. This policy will be updated accordingly.</p>
        </Section>

        <Section title="Cookies and Local Storage">
          <p>CrucibleRPG uses only essential cookies and browser local storage necessary to operate the service, specifically: session authentication tokens (to keep you logged in) and user interface preferences (such as theme settings). We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
        </Section>

        <Section title="Do Not Track">
          <p>We do not track users across third-party websites. We do not respond to Do Not Track browser signals, as we do not engage in cross-site tracking.</p>
        </Section>

        <Section title="Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. If we make material changes to how we collect, use, or share your personal information, we will notify you by email or by posting a prominent notice on the service at least 30 days before the changes take effect. Your continued use of the service after changes take effect constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="Contact">
          <p>If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:</p>
          <p style={{ marginTop: 12 }}>William Weidig<br /><a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a><br />300 Sandy Beach Road, Ellington CT 06029</p>
        </Section>
      </ClientFadeIn>

      <Footer />
    </div>
  );
}
