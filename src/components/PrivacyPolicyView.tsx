import React from 'react';
import { Shield, ArrowLeft, Cookie, Eye, Lock, Server, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onContactClick?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack, onContactClick }) => {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold mb-6 hover:underline cursor-pointer transition-colors"
        style={{ color: 'var(--brand)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Developer Tools</span>
      </button>

      <div
        className="p-6 sm:p-10 rounded-3xl border shadow-sm space-y-8"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div className="border-b pb-6" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="p-2.5 rounded-2xl text-white shadow-sm flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B52E8 0%, #009f88 100%)' }}
            >
              <Shield className="w-6 h-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                Privacy Policy
              </h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
                Last Updated: September 4, 2026 &bull; Effective Immediately
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting developer privacy and data confidentiality. This Privacy Policy explains how information is handled when you use <strong style={{ color: 'var(--ink)' }}>https://www.codepackr.com</strong> and our suite of online developer formatters, validators, encoders, and utilities.
          </p>
        </div>

        {/* Section 1: Client-Side Processing Architecture */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              1. 100% Client-Side Processing Architecture
            </h2>
          </div>
          <div
            className="p-4 rounded-2xl border space-y-2 text-sm leading-relaxed"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong style={{ color: 'var(--ink)' }}>Zero Server Transmission for Tool Payloads:</strong>
                <p className="mt-1" style={{ color: 'var(--muted)' }}>
                  All input data, source code, JSON/XML structures, EDI transactions, JWT tokens, hashes, passwords, SQL queries, and files processed through Codepackr run <strong style={{ color: 'var(--ink)' }}>entirely in your local browser runtime</strong> using JavaScript and client-side Web APIs.
                </p>
              </div>
            </div>
            <p className="text-xs pt-1" style={{ color: 'var(--muted)' }}>
              We do not upload, transmit, store, inspect, log, or sell your source code, configuration files, or sensitive payloads to any remote servers or third parties. When you close or refresh your browser tab, memory used by the tool execution is cleared.
            </p>
          </div>
        </section>

        {/* Section 2: Advertising & Google AdSense */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              2. Google AdSense &amp; Third-Party Cookies
            </h2>
          </div>
          <div className="text-sm space-y-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p>
              We display advertisements provided by <strong style={{ color: 'var(--ink)' }}>Google AdSense</strong> (Publisher ID: <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-200 dark:bg-neutral-800">pub-7526363571565796</code>) to help fund the hosting, maintenance, and continuous development of free developer utilities.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to this website or other websites on the internet.
              </li>
              <li>
                Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to Codepackr and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:opacity-80"
                  style={{ color: 'var(--brand)' }}
                >
                  Google Ads Settings
                </a>.
              </li>
              <li>
                Alternatively, you can opt out of a third-party vendor&rsquo;s use of cookies for personalized advertising by visiting{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:opacity-80"
                  style={{ color: 'var(--brand)' }}
                >
                  www.aboutads.info
                </a>{' '}
                or the Network Advertising Initiative opt-out page at{' '}
                <a
                  href="https://optout.networkadvertising.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:opacity-80"
                  style={{ color: 'var(--brand)' }}
                >
                  networkadvertising.org
                </a>.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Web Analytics & Diagnostics */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              3. Web Analytics &amp; Diagnostic Telemetry
            </h2>
          </div>
          <div className="text-sm space-y-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p>
              To monitor site reliability, optimize performance, and understand which developer tools are most valuable, we use industry-standard web analytics services:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <strong className="block text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  Google Analytics
                </strong>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 block mb-1">
                  Tag ID: G-1WPJJP0CHB
                </span>
                <p>
                  Collects aggregate telemetry such as general geographical location (country/city level), browser family, screen resolution, referral sources, and page view events. IP anonymization is enabled.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <strong className="block text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  Microsoft Clarity
                </strong>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 block mb-1">
                  Project ID: ya1n0vs9s5
                </span>
                <p>
                  Provides session behavioral analysis, navigation patterns, and click heatmaps to diagnose UX glitches and broken layouts. Keystrokes and form inputs in developer tool textareas are masked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Local Storage */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500 shrink-0" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              4. Browser Local Storage
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr utilizes your web browser&rsquo;s standard <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-200 dark:bg-neutral-800">localStorage</code> purely to remember your client-side display preferences:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs" style={{ color: 'var(--muted)' }}>
            <li><strong style={{ color: 'var(--ink)' }}>Theme preference:</strong> (Light vs. Dark mode)</li>
            <li><strong style={{ color: 'var(--ink)' }}>Tool bookmarks:</strong> Your pinned list of favorite tools for rapid access</li>
            <li><strong style={{ color: 'var(--ink)' }}>Diff view mode:</strong> (Split vs. Unified diff preference)</li>
          </ul>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            This information stays exclusively inside your browser and can be cleared at any time via your browser settings or Developer Tools.
          </p>
        </section>

        {/* Section 5: GDPR & CCPA Rights */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              5. Rights Under GDPR &amp; CCPA / CPRA
            </h2>
          </div>
          <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p>
              Depending on your jurisdiction (such as the European Economic Area, United Kingdom, or California), you may possess legal rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>The right to access, rectify, or request deletion of personal information held about you.</li>
              <li>The right to withdraw consent for non-essential analytics and advertising cookies at any time.</li>
              <li>The right to non-discrimination for exercising your privacy choices.</li>
            </ul>
            <p className="text-xs">
              Because Codepackr does not require user account registration and does not transmit, store, or profile your tool code payloads, we do not maintain identifiable developer records or personal profiles to sell or share.
            </p>
          </div>
        </section>

        {/* Section 6: Contact Information */}
        <section className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--line)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
            6. Contact &amp; Privacy Inquiries
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            If you have questions, feedback, or concerns regarding this Privacy Policy or our client-side data handling practices, please contact us via our feedback form:
          </p>
          <div className="flex items-center gap-3 pt-1">
            {onContactClick ? (
              <button
                onClick={onContactClick}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                Go to Contact &amp; Feedback
              </button>
            ) : (
              <a
                href="/contact.html"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                Go to Contact &amp; Feedback
              </a>
            )}
            <a
              href="https://github.com/coolnaveen99/codepackr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:border-[var(--brand)]"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              GitHub Repository
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
