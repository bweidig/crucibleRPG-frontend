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

export default function TermsOfServicePage() {
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
        }}>Terms of Service</h1>
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
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of CrucibleRPG, operated by William Weidig (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), located in Connecticut, United States. By creating an account or using the service, you agree to be bound by these Terms. If you do not agree, do not use the service.
        </p>

        <Section title="Eligibility">
          <p>You must be at least 18 years of age to create an account or use CrucibleRPG. By creating an account, you confirm that you are 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If we learn that a user is under 18, we will terminate the account and delete associated data.</p>
        </Section>

        <Section title="Account Responsibilities">
          <p style={{ marginBottom: 12 }}>You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account. You must provide accurate information when creating your account. You agree to notify us promptly if you become aware of any unauthorized use of your account.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, at our sole discretion.</p>
        </Section>

        <Section title="Description of Service">
          <p>CrucibleRPG is an AI-powered solo tabletop role-playing game. The service consists of a game engine that resolves mechanical actions (dice rolls, stat calculations, inventory management, consequence tracking) on our servers, paired with AI-generated narrative text produced by third-party language model providers. The AI generates prose descriptions of game events. The server determines all mechanical outcomes.</p>
        </Section>

        <Section title="Intellectual Property">
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Our Property.</strong> The CrucibleRPG game engine, website, user interface, rulebook, system manual, proprietary algorithms, prompt engineering, server-side logic, and all human-authored creative assets (including but not limited to visual design, copywriting, and game mechanics) are the exclusive intellectual property of William Weidig. All rights are reserved. You may not copy, modify, distribute, reverse-engineer, or create derivative works from any part of the service without our prior written consent.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Your Inputs.</strong> By submitting content to CrucibleRPG — including character descriptions, custom actions, backstories, and other text you type into the service — you grant us a non-exclusive, worldwide, royalty-free license to store, process, transmit, and use that content solely for the purpose of operating the service and improving the game experience. You retain ownership of the original text you write.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>AI-Generated Content.</strong> Narrative text generated by the AI during gameplay is produced by third-party language models and does not constitute the creative work of any human author. Under current United States copyright law, AI-generated content may not be eligible for copyright protection. You are granted a limited, personal, non-commercial license to view, read, and interact with AI-generated content within the CrucibleRPG service. You may not claim copyright ownership over AI-generated game narratives, commercially republish AI-generated content from the service, or use automated tools to extract or scrape AI-generated text for any purpose, including but not limited to training competing language models or AI systems.</p>
        </Section>

        <Section title="AI-Generated Content Disclaimer">
          <p style={{ marginBottom: 12 }}>CrucibleRPG uses third-party artificial intelligence services (including but not limited to Google Gemini and OpenAI) to generate narrative text. You acknowledge and agree that:</p>
          <LegalList items={[
            'All AI-generated content is produced for entertainment purposes only',
            'AI-generated content may contain factual inaccuracies, inconsistencies, or fabricated information',
            'AI-generated content does not represent the views, opinions, promises, or commitments of William Weidig',
            'No statement made by any AI-generated character, narrator, or entity within the game constitutes a binding promise, offer, guarantee, or representation by us',
            'You may not rely on any AI-generated content for factual accuracy, professional advice, legal guidance, medical information, financial decisions, or any purpose other than entertainment',
          ]} />
          <p style={{ marginTop: 16 }}>We do not pre-review individual AI outputs before they are displayed. While we implement content guardrails and safety filters, we cannot guarantee that all AI-generated content will be appropriate, accurate, or free from error.</p>
        </Section>

        <Section title="Content Boundaries and Acceptable Use">
          <p style={{ marginBottom: 12 }}>CrucibleRPG is a mature game that includes graphic violence, dark themes, morally complex scenarios, and adult content appropriate for players aged 18 and older.</p>
          <p style={{ marginBottom: 12 }}>The following content is strictly prohibited and will not be generated by the service. Any attempt to manipulate the AI into producing such content may result in account suspension or termination:</p>
          <LegalList items={[
            'Sexual or romantic content involving minors (anyone under 18), including suggestive descriptions, grooming scenarios, or age-ambiguous framing',
            'Sexual assault or non-consensual sexual content',
            'Detailed, actionable instructions for real-world harm (weapon construction, drug synthesis, explosive fabrication)',
            'Content targeting real-world racial, ethnic, religious, or gender groups with slurs, supremacist rhetoric, or incitement to violence',
            'Content depicting real, named individuals',
          ]} />
          <p style={{ marginTop: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Acceptable Use.</strong> You agree not to: attempt to bypass, circumvent, or disable any content safety features of the service; use the service to generate content intended to harass, threaten, defame, or harm any real person; use automated tools, bots, or scripts to interact with the service without our express permission; share your account credentials with others; resell, sublicense, or commercially exploit any aspect of the service.</p>
        </Section>

        <Section title="Subscriptions and Payments">
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Subscription Plans.</strong> CrucibleRPG offers paid subscription plans billed on a monthly recurring basis. Subscription details, pricing, and included turn allotments are described on our Pricing page. All prices are listed in United States Dollars.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Turn Packs.</strong> Additional turns may be purchased as one-time turn packs. Turn packs are non-refundable once any turns from the pack have been consumed.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Billing.</strong> Payments are processed by Stripe, Inc. We do not store, process, or have access to your full credit card number. All payment data is handled directly by Stripe in accordance with PCI DSS standards. Your subscription automatically renews each billing cycle unless you cancel. You may cancel at any time through your account settings. Cancellation takes effect at the end of your current billing period — you retain access to the service until that date.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Refund Policy.</strong> Subscription payments are non-refundable for the current billing period. If you cancel, your subscription remains active through the end of the period you have already paid for. Turn packs are refundable within 7 calendar days of purchase, provided that no turns from the pack have been consumed. If any turns have been consumed, the pack is non-refundable. We reserve the right to issue refunds at our discretion in cases of service outage or billing errors.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>Price Changes.</strong> We may change subscription prices or turn pack prices with 30 days&rsquo; advance notice. Price changes take effect at the start of your next billing cycle following the notice period. Continued use of the service after a price change constitutes acceptance of the new price.</p>
        </Section>

        <Section title="Free Trial">
          <p>We may offer a free trial that includes a limited number of turns and world creations. The free trial requires account creation but does not require payment information. Progress made during the free trial carries over if you subscribe. Free trial terms may change at any time.</p>
        </Section>

        <Section title="Service Availability">
          <p style={{ marginBottom: 12 }}>We strive to keep CrucibleRPG available at all times but do not guarantee uninterrupted service. The service may be temporarily unavailable due to maintenance, updates, server issues, or circumstances beyond our control. We are not liable for any loss or inconvenience caused by service interruptions.</p>
          <p>We rely on third-party AI providers (Google, OpenAI, Anthropic) to generate narrative content. Changes to these providers&rsquo; services, pricing, availability, or policies may affect CrucibleRPG&rsquo;s functionality. We are not liable for disruptions caused by third-party provider changes.</p>
        </Section>

        <Section title="Data and Saves">
          <p>Your game saves, character data, and campaign progress are stored on our servers. If you cancel your subscription, your data is retained for a reasonable period. If you resubscribe, your saved data will be available. We reserve the right to delete account data after an extended period of inactivity (12 months or more) following written notice to your registered email address.</p>
        </Section>

        <Section title="Termination">
          <p style={{ marginBottom: 12 }}>We may suspend or terminate your account at any time for violation of these Terms, including but not limited to: repeated attempts to generate prohibited content, circumvention of safety features, use of automated scraping tools, abusive behavior toward our staff or systems, or failure to pay.</p>
          <p>You may delete your account at any time by contacting us. Upon account deletion, we will delete your personal information and game data in accordance with our Privacy Policy.</p>
        </Section>

        <Section title="Limitation of Liability">
          <p style={{ marginBottom: 12 }}>To the maximum extent permitted by law, William Weidig shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to: emotional distress caused by AI-generated content, loss of data, loss of profits, or service interruptions.</p>
          <p>Our total cumulative liability for any claims arising from or related to the service shall not exceed the total amount you have paid to us in the twelve (12) months preceding the claim.</p>
        </Section>

        <Section title="Indemnification">
          <p>You agree to indemnify, defend, and hold harmless William Weidig from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys&rsquo; fees) arising from: your use of the service, your violation of these Terms, your violation of any applicable law, or any content you submit to the service.</p>
        </Section>

        <Section title="Dispute Resolution">
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Governing Law.</strong> These Terms are governed by the laws of the State of Connecticut, without regard to conflict of law principles.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: 'var(--text-heading)' }}>Arbitration.</strong> Any disputes arising from or relating to these Terms or the service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, conducted in the State of Connecticut. You agree to waive any right to a jury trial or to participate in a class action lawsuit.</p>
          <p><strong style={{ color: 'var(--text-heading)' }}>Informal Resolution.</strong> Before initiating arbitration, you agree to contact us at <a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a> and attempt to resolve the dispute informally for at least 30 days.</p>
        </Section>

        <Section title="Changes to These Terms">
          <p>We may update these Terms from time to time. If we make material changes, we will notify you by email or by posting a notice on the service at least 30 days before the changes take effect. Your continued use of the service after changes take effect constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section title="Severability">
          <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
        </Section>

        <Section title="Contact">
          <p>If you have questions about these Terms, contact us at <a className={styles.legalLink} href="mailto:support@cruciblerpg.com">support@cruciblerpg.com</a>.</p>
        </Section>
      </ClientFadeIn>

      <Footer />
    </div>
  );
}
