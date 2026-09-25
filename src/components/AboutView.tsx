import React from 'react';
import { ArrowLeft, User, Shield, Globe, Wrench, Mail, MapPin, CheckCircle2 } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
  onContactClick: () => void;
  onGoPrivacy: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, onContactClick, onGoPrivacy }) => {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold hover:underline cursor-pointer"
        style={{ color: 'var(--brand)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Developer Tools</span>
      </button>

      <article
        className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-8"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <header className="border-b pb-6 space-y-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand)' }}>
              <User className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              About Codepackr
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr is an independent, privacy-first suite of free browser tools for developers,
            integrators, and students. Every formatter, validator, converter, EDI utility, and image
            tool runs locally in your browser. Your payloads are not uploaded to our servers.
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Last updated: 25 September 2026 · Operated from Chennai, India
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <User className="w-4 h-4 text-[var(--brand)]" />
            Who operates this site
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr is built and maintained by <strong>Naveen</strong>, a software developer based
            in Chennai, India. It is a solo project — not a venture-backed company and not affiliated
            with Google, Microsoft, or any EDI standards body. The public source for the developer
            suite is available at{' '}
            <a
              href="https://github.com/coolnaveen99/codepackr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: 'var(--brand)' }}
            >
              github.com/coolnaveen99/codepackr
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Wrench className="w-4 h-4 text-[var(--brand)]" />
            What the site is for
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            The goal is a single, fast place to format JSON, inspect JWT tokens, convert XML and CSV,
            validate regex, work with ANSI X12 / EDIFACT documents, and run related utilities without
            creating an account. Related Codepackr properties cover finance calculators, study tools,
            and other specialized suites, all with the same client-side rule.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
            <li>No user accounts and no login wall for core tools.</li>
            <li>No server-side processing of pasted code, files, or EDI payloads.</li>
            <li>Installable as a Progressive Web App for offline use after the first load.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Shield className="w-4 h-4 text-[var(--brand)]" />
            Advertising and analytics
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr is free to use. To keep the tools free, the site may display Google AdSense
            advertisements (publisher ID <code>ca-pub-7526363571565796</code>). Third-party vendors,
            including Google, may use cookies to serve ads. You can opt out of personalized ads in
            Google Ads Settings. Aggregate, anonymized analytics may be collected with Google
            Analytics and Microsoft Clarity. Tool inputs themselves are not sent with that telemetry.
            Details are in the{' '}
            <button type="button" onClick={onGoPrivacy} className="font-semibold underline cursor-pointer" style={{ color: 'var(--brand)' }}>
              Privacy Policy
            </button>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Mail className="w-4 h-4 text-[var(--brand)]" />
            Contact the operator
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            For bugs, tool requests, privacy questions, or legal notices, use the contact form or
            email the operator directly:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
            <li>
              <a href="mailto:codepackr@gmail.com" className="font-semibold underline" style={{ color: 'var(--brand)' }}>
                codepackr@gmail.com
              </a>
            </li>
            <li>
              <a href="mailto:tnavkum@gmail.com" className="font-semibold underline" style={{ color: 'var(--brand)' }}>
                tnavkum@gmail.com
              </a>
            </li>
            <li>
              Contact form:{' '}
              <button type="button" onClick={onContactClick} className="font-semibold underline cursor-pointer" style={{ color: 'var(--brand)' }}>
                codepackr.com/contact
              </button>
            </li>
          </ul>
          <p className="text-sm flex items-start gap-2" style={{ color: 'var(--muted)' }}>
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            Operating location: Chennai, Tamil Nadu, India.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Globe className="w-4 h-4 text-[var(--brand)]" />
            Related properties
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
            <li>
              <a href="https://www.codepackr.com/" className="underline" style={{ color: 'var(--brand)' }}>
                www.codepackr.com
              </a>{' '}
              — developer utilities
            </li>
            <li>
              <a href="https://finance.codepackr.com/" className="underline" style={{ color: 'var(--brand)' }}>
                finance.codepackr.com
              </a>{' '}
              — client-side finance calculators
            </li>
          </ul>
        </section>

        <div className="border-t pt-6 flex items-center gap-2 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Independent project. No accounts. No payload uploads.</span>
        </div>
      </article>
    </div>
  );
};
