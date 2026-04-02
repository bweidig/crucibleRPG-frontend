import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import ClientFadeIn from '@/components/ClientFadeIn';
import styles from './page.module.css';

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
        borderBottom: '1px solid #1e2540',
      }}>{title}</h2>
      <div style={{
        fontFamily: 'var(--font-alegreya-sans)',
        fontSize: 15,
        fontWeight: 400,
        color: 'var(--text-secondary-bright)',
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
          fontSize: 15, color: 'var(--text-secondary-bright)', lineHeight: 1.75,
        }}>
          <span style={{ color: 'var(--gold-muted)', flexShrink: 0, marginTop: 1 }}>&middot;</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      position: 'relative',
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
        }}>Last updated: March 15, 2026</p>
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
          fontSize: 15, fontWeight: 400,
          color: 'var(--text-secondary-bright)', lineHeight: 1.75,
          marginBottom: 48,
        }}>
          Welcome to CrucibleRPG. These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and William Weidig (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). By creating an account or using CrucibleRPG, you agree to these Terms. If you don&rsquo;t agree, don&rsquo;t use the service.
        </p>

        <Section title="Eligibility">
          <p>You must be at least 16 years old to use CrucibleRPG. By creating an account, you confirm that you are 16 or older. If we learn that a user is under 16, we will terminate their account.</p>
        </Section>

        <Section title="Your Account">
          <p style={{ marginBottom: 12 }}>You are responsible for keeping your login credentials secure. You are responsible for all activity that occurs under your account. If you believe your account has been compromised, contact us immediately at <a className={styles.legalLink} href="mailto:support@crucibleRPG.com">support@crucibleRPG.com</a>.</p>
          <p>One account per person. Do not share your account with others.</p>
        </Section>

        <Section title="Subscriptions and Payment">
          <p style={{ marginBottom: 8 }}>CrucibleRPG offers a subscription plan and optional turn top-up packs. Here&rsquo;s how billing works:</p>
          <LegalList items={[
            'Subscription. Your subscription renews automatically each billing cycle at the current rate. You can cancel anytime. Cancellation takes effect at the end of your current billing period, and you retain access until then.',
            'Turn packs. Top-up packs are one-time purchases and are non-refundable once turns have been used.',
            'Free trial. The free trial includes a limited number of turns and world creations. One trial per account. No credit card required.',
            'Price changes. We may change subscription prices with at least 30 days\' notice. Price changes take effect at your next billing cycle after the notice period.',
            'Refunds. If you believe you were charged in error, contact us at support@crucibleRPG.com. We handle refund requests on a case-by-case basis. Unused subscription time from voluntary cancellation is not refunded.',
          ]} />
          <p style={{ marginTop: 16 }}>All payments are processed through Stripe. By subscribing, you also agree to Stripe&rsquo;s terms of service.</p>
        </Section>

        <Section title="What You Can Do">
          <p style={{ marginBottom: 8 }}>CrucibleRPG grants you a personal, non-exclusive, non-transferable license to use the service for your own entertainment. You may:</p>
          <LegalList items={[
            'Create characters, worlds, and campaigns',
            'Play through AI-generated narratives',
            'Save and resume your game sessions',
          ]} />
        </Section>

        <Section title="What You Cannot Do">
          <p style={{ marginBottom: 8 }}>You agree not to:</p>
          <LegalList items={[
            'Use CrucibleRPG for any illegal purpose',
            'Attempt to reverse-engineer, decompile, or extract the source code of the game engine, AI prompts, or server-side mechanics',
            'Exploit bugs, glitches, or vulnerabilities instead of reporting them',
            'Use automated tools, bots, or scripts to interact with the service',
            'Harass, threaten, or impersonate others through any feature of the service',
            'Attempt to circumvent usage limits, billing, or account restrictions',
            'Resell, sublicense, or commercially redistribute your access to the service',
            'Deliberately attempt to generate content that is illegal, hateful, or sexually explicit through manipulation of AI inputs',
          ]} />
          <p style={{ marginTop: 16 }}>If you violate these terms, we may suspend or terminate your account at our discretion.</p>
        </Section>

        <Section title="AI-Generated Content">
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>It&rsquo;s not perfect.</strong> AI-generated content may contain errors, inconsistencies, anachronisms, or unexpected material. We use a game engine to guide and constrain the output, but we cannot guarantee that every piece of generated content will be accurate, appropriate, or consistent.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>It&rsquo;s not advice.</strong> Nothing generated by CrucibleRPG should be interpreted as real-world advice of any kind, including medical, legal, financial, or safety advice. It&rsquo;s a game.</p>
          <p><strong style={{ color: '#b0a890' }}>Content boundaries.</strong> We design our system prompts and engine to keep content within reasonable bounds for a fantasy RPG experience. However, due to the nature of AI, we cannot guarantee that all generated content will be suitable for all audiences at all times.</p>
        </Section>

        <Section title="Who Owns What">
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>Your inputs.</strong> You own the original inputs you provide: character names, custom descriptions, choices, and any text you write.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>AI-generated content.</strong> Game narratives, NPC dialogue, world descriptions, and other AI-generated content are created by our system based on your inputs. Ownership of AI-generated content is a developing area of law. For practical purposes: your game data (including AI-generated content) is stored in your account, is accessible to you, and will be deleted if you request it. You may use your game content for personal purposes (sharing screenshots, writing about your campaigns, etc.). You may not claim AI-generated content as solely your own original work for commercial publication without significant creative transformation.</p>
          <p><strong style={{ color: '#b0a890' }}>Our stuff.</strong> The CrucibleRPG game engine, system design, prompts, interface, branding, and all underlying technology belong to us. These Terms do not transfer any ownership of our intellectual property to you.</p>
        </Section>

        <Section title="Your Game Data">
          <p style={{ marginBottom: 12 }}>Your characters, worlds, campaigns, and session data are stored on our servers. We keep your data as long as your account is active. If you cancel your subscription, your data is preserved. You can come back later and pick up where you left off.</p>
          <p style={{ marginBottom: 12 }}>If you delete your account, your game data is permanently deleted (subject to a brief backup retention period as described in our Privacy Policy).</p>
          <p>We are not liable for data loss due to circumstances beyond our reasonable control, though we take standard precautions to protect and back up your data.</p>
        </Section>

        <Section title="Service Availability">
          <p style={{ marginBottom: 12 }}>We aim to keep CrucibleRPG available and running, but we do not guarantee uninterrupted service. The service may be temporarily unavailable due to maintenance, updates, server issues, or circumstances beyond our control. We are not liable for downtime or data loss resulting from service interruptions.</p>
          <p>We reserve the right to modify, update, or discontinue features of the service at any time. If we discontinue the service entirely, we will provide at least 30 days&rsquo; notice and offer a way to export your game data.</p>
        </Section>

        <Section title="Termination">
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>By you.</strong> You can delete your account at any time. This cancels your subscription and begins the data deletion process described in our Privacy Policy.</p>
          <p><strong style={{ color: '#b0a890' }}>By us.</strong> We may suspend or terminate your account if you violate these Terms, engage in abusive behavior, or if required by law. In cases of serious violations, termination may be immediate. Otherwise, we will attempt to notify you and give you an opportunity to address the issue.</p>
        </Section>

        <Section title="Limitation of Liability">
          <p style={{ marginBottom: 12 }}>To the maximum extent permitted by law, CrucibleRPG and its operator are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. This includes, but is not limited to, loss of data, loss of profits, or damages arising from AI-generated content.</p>
          <p>Our total liability to you for any claim related to the service is limited to the amount you paid us in the 12 months preceding the claim, or $50, whichever is greater.</p>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>CrucibleRPG is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that AI-generated content will meet any particular standard of quality, accuracy, or appropriateness.</p>
        </Section>

        <Section title="Disputes">
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>Governing law.</strong> These Terms are governed by the laws of the state of Connecticut, without regard to conflict of law principles.</p>
          <p style={{ marginBottom: 16 }}><strong style={{ color: '#b0a890' }}>Informal resolution first.</strong> Before filing any formal dispute, you agree to contact us at <a className={styles.legalLink} href="mailto:support@crucibleRPG.com">support@crucibleRPG.com</a> and attempt to resolve the issue informally for at least 30 days.</p>
          <p><strong style={{ color: '#b0a890' }}>Jurisdiction.</strong> Any disputes not resolved informally will be subject to the exclusive jurisdiction of the courts in Connecticut.</p>
        </Section>

        <Section title="Changes to These Terms">
          <p>We may update these Terms from time to time. If we make significant changes, we will notify you by email or through a prominent notice on the site at least 14 days before the changes take effect. Your continued use of CrucibleRPG after changes take effect means you accept the updated Terms.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about these Terms? Reach us at <a className={styles.legalLink} href="mailto:support@crucibleRPG.com">support@crucibleRPG.com</a>.</p>
        </Section>
      </ClientFadeIn>

      <Footer />
    </div>
  );
}
