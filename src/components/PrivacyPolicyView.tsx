import React, { useState, useEffect } from 'react';
import {
  Shield,
  ArrowLeft,
  Cookie,
  Eye,
  Lock,
  Server,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ExternalLink,
  Info,
  Clock
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onContactClick?: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({
  onBack,
  onContactClick,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Back button */}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span
                className="p-3 rounded-2xl text-white shadow-sm flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #5B52E8 0%, #009f88 100%)' }}
              >
                {activeTab === 'privacy' ? (
                  <Shield className="w-6 h-6 text-white" />
                ) : (
                  <Scale className="w-6 h-6 text-white" />
                )}
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                  {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
                </h1>
                <p className="text-xs font-medium mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last Updated: September 4, 2026 &bull; Version 2.4 &bull; Effective Immediately</span>
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div
              className="inline-flex p-1 rounded-2xl border self-start sm:self-auto"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-[var(--brand)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'terms'
                    ? 'bg-[var(--brand)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms &amp; Conditions</span>
              </button>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Codepackr (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) provides free, high-performance web-based developer tools with a core commitment to data confidentiality, transparent telemetry disclosure, and uncompromised client-side execution.
          </p>

          {/* Key Commitments Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">100% In-Browser</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Zero server payload uploads</span>
            </div>
            <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block">No Account Required</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>No sign-up or profile data</span>
            </div>
            <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">Free &amp; Unrestricted</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Personal &amp; commercial use</span>
            </div>
            <div className="p-2.5 rounded-xl border text-center" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 block">GDPR &amp; CCPA Ready</span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Strict masking &amp; opt-outs</span>
            </div>
          </div>
        </div>

        {/* TAB 1: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-8">
            {/* Quick Jump Index */}
            <div className="p-4 rounded-2xl border text-xs" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <strong className="block font-semibold mb-2" style={{ color: 'var(--ink)' }}>Table of Contents:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" style={{ color: 'var(--muted)' }}>
                <a href="#p-client-side" className="hover:text-[var(--brand)] transition-colors">1. Client-Side Processing Architecture</a>
                <a href="#p-adsense" className="hover:text-[var(--brand)] transition-colors">2. Google AdSense &amp; Advertising Cookies</a>
                <a href="#p-analytics" className="hover:text-[var(--brand)] transition-colors">3. Web Analytics &amp; Diagnostic Telemetry</a>
                <a href="#p-localstorage" className="hover:text-[var(--brand)] transition-colors">4. Browser Local Storage &amp; Cache</a>
                <a href="#p-clipboard" className="hover:text-[var(--brand)] transition-colors">5. Clipboard &amp; File Upload Access</a>
                <a href="#p-rights" className="hover:text-[var(--brand)] transition-colors">6. International Privacy Rights (GDPR / CCPA)</a>
                <a href="#p-security" className="hover:text-[var(--brand)] transition-colors">7. Data Security &amp; Encryption in Transit</a>
                <a href="#p-children" className="hover:text-[var(--brand)] transition-colors">8. Children&rsquo;s Privacy Protection</a>
                <a href="#p-contact" className="hover:text-[var(--brand)] transition-colors">9. Contact Information &amp; Inquiries</a>
              </div>
            </div>

            {/* Section 1 */}
            <section id="p-client-side" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  1. 100% Client-Side Processing Architecture
                </h2>
              </div>
              <div
                className="p-4 rounded-2xl border space-y-3 text-sm leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>Zero Server Transmission for Tool Payloads:</strong>
                    <p className="mt-1" style={{ color: 'var(--muted)' }}>
                      All data you input, paste, format, convert, validate, or inspect—including source code, JSON/XML structures, EDI transactions, JWT tokens, hashes, passwords, SQL queries, regex patterns, and uploaded files—is processed <strong style={{ color: 'var(--ink)' }}>strictly within your local browser runtime</strong> using JavaScript and client-side Web APIs (e.g., Canvas, Web Workers, SubtleCrypto).
                    </p>
                  </div>
                </div>
                <p className="text-xs pt-1 border-t" style={{ color: 'var(--muted)', borderColor: 'var(--line)' }}>
                  <strong>Zero Server-Side Storage:</strong> We do not upload, transmit, store, inspect, log, share, or sell your source code, configuration files, or sensitive payloads to any remote servers, cloud databases, or third-party APIs. When you close or refresh your browser tab, all transient memory allocated for data processing is immediately wiped by your browser&rsquo;s garbage collector.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="p-adsense" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  2. Google AdSense &amp; Third-Party Cookies
                </h2>
              </div>
              <div className="text-sm space-y-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  To support the ongoing hosting, maintenance, and continuous development of free developer utilities without charging subscriptions or introducing paywalls, Codepackr displays advertisements served by <strong style={{ color: 'var(--ink)' }}>Google AdSense</strong> (Publisher ID: <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-200 dark:bg-neutral-800">pub-7526363571565796</code>).
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>
                    Third-party vendors, including Google, use cookies and web beacons to serve advertisements based on a user&rsquo;s prior visits to Codepackr or other websites across the Internet.
                  </li>
                  <li>
                    Google&rsquo;s use of advertising cookies enables it and its network partners to serve relevant ads based on browsing history and contextual signals in accordance with Google Publisher Policies.
                  </li>
                  <li>
                    <strong>Opt-Out of Personalized Ads:</strong> Users may opt out of personalized advertising at any time by configuring their preferences in{' '}
                    <a
                      href="https://adssettings.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:opacity-80 inline-flex items-center gap-0.5"
                      style={{ color: 'var(--brand)' }}
                    >
                      <span>Google Ads Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                  <li>
                    Alternatively, you can opt out of a third-party vendor&rsquo;s use of advertising cookies through the Digital Advertising Alliance at{' '}
                    <a
                      href="https://www.aboutads.info/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:opacity-80 inline-flex items-center gap-0.5"
                      style={{ color: 'var(--brand)' }}
                    >
                      <span>www.aboutads.info</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>, the Network Advertising Initiative at{' '}
                    <a
                      href="https://optout.networkadvertising.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:opacity-80 inline-flex items-center gap-0.5"
                      style={{ color: 'var(--brand)' }}
                    >
                      <span>networkadvertising.org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>, or the European Interactive Digital Advertising Alliance (EDAA) at{' '}
                    <a
                      href="https://www.youronlinechoices.eu/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:opacity-80 inline-flex items-center gap-0.5"
                      style={{ color: 'var(--brand)' }}
                    >
                      <span>youronlinechoices.eu</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="p-analytics" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  3. Web Analytics &amp; Diagnostic Telemetry
                </h2>
              </div>
              <div className="text-sm space-y-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  To monitor site availability, prevent technical bugs, and determine which tools require optimization, we collect anonymized, aggregate telemetry using reputable diagnostic providers:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                    <strong className="block text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                      Google Analytics 4
                    </strong>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 block mb-1">
                      Measurement Tag: G-623PS59FEY
                    </span>
                    <p>
                      Collects non-personally identifiable telemetry such as approximate geographic country/region, device family, operating system, browser type, referral URLs, and page visit duration. IP anonymization is permanently enabled.
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
                      Provides aggregate behavioral insights, scroll depths, and click patterns to troubleshoot broken CSS layouts. All text inputs, code editors, and textareas have strict masking enabled, ensuring code snippets and text entries are never recorded or transmitted.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="p-localstorage" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  4. Browser Local Storage &amp; Cache
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Codepackr utilizes your browser&rsquo;s native <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-200 dark:bg-neutral-800">localStorage</code> purely to remember your personal UI configuration between visits:
              </p>
              <div className="p-3.5 rounded-2xl border text-xs space-y-1.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">codepackr_theme</code>
                  <span style={{ color: 'var(--muted)' }}>Saves Light vs. Dark theme selection</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--line)' }}>
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">codepackr_bookmarks</code>
                  <span style={{ color: 'var(--muted)' }}>Saves your list of pinned favorite tools</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">diff-split-mode</code>
                  <span style={{ color: 'var(--muted)' }}>Saves Split vs. Unified comparison preferences</span>
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                This data is stored purely on your local hard drive and is never transmitted over the network. You can clear this data at any time through your browser settings or developer inspection console.
              </p>
            </section>

            {/* Section 5 */}
            <section id="p-clipboard" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  5. Clipboard &amp; File Upload Access
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  When you use features such as &ldquo;Copy Result&rdquo;, &ldquo;Paste Sample Data&rdquo;, or &ldquo;Upload File for Inspection&rdquo;:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Explicit User Action Only:</strong> Clipboard operations are triggered solely upon your direct interactive gesture (clicking the Copy or Paste button). We never background-sniff or monitor your system clipboard.</li>
                  <li><strong>In-Memory File Parsing:</strong> File inputs (such as JSON, XML, EDI files, or images) are read into browser RAM via the HTML5 File and FileReader APIs. Files are never uploaded to any remote storage.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="p-rights" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  6. International Privacy Rights (GDPR, UK GDPR, CCPA / CPRA)
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  Depending on your geographic location (including the European Economic Area, United Kingdom, Brazil, Canada, and California), you possess statutory rights regarding your data:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Right to Know &amp; Access:</strong> You can request information on how data is handled.</li>
                  <li><strong>Right to Erasure &amp; Rectification:</strong> You have the right to request deletion or correction of any stored data.</li>
                  <li><strong>Do Not Sell or Share My Personal Information:</strong> Under CCPA/CPRA, we do not sell or rent personal information to any third parties for monetary or valuable consideration.</li>
                  <li><strong>Right to Non-Discrimination:</strong> We do not degrade service quality or restrict tool functionality based on your exercise of privacy rights.</li>
                </ul>
                <p className="text-xs pt-1">
                  <em>Privacy by Design Note:</em> Because Codepackr does not feature user account registration, passwords, email profiles, or server-side database records of tool inputs, we hold zero identifiable developer files or personal user profiles.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="p-security" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  7. Data Security &amp; Encryption in Transit
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                All web traffic and asset deliveries between your device and Codepackr are strictly protected via modern <strong style={{ color: 'var(--ink)' }}>HTTPS / TLS 1.3 encryption</strong> with automated certificate rotation, HTTP Strict Transport Security (HSTS), and a strict Content Security Policy (CSP) to mitigate cross-site scripting (XSS) risks.
              </p>
            </section>

            {/* Section 8 */}
            <section id="p-children" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  8. Children&rsquo;s Privacy Protection
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Codepackr is a software engineering productivity portal intended for developers, IT professionals, and students. We do not knowingly solicit, collect, or process personal data from children under the age of 13 (or under 16 within the EEA) in accordance with the Children&rsquo;s Online Privacy Protection Act (COPPA).
              </p>
            </section>

            {/* Section 9 */}
            <section id="p-contact" className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                9. Contact Information &amp; Inquiries
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                If you have questions, feedback, or compliance inquiries regarding our Privacy Policy or data architecture, please connect with us:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
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
        )}

        {/* TAB 2: TERMS AND CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="space-y-8">
            {/* Quick Jump Index */}
            <div className="p-4 rounded-2xl border text-xs" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <strong className="block font-semibold mb-2" style={{ color: 'var(--ink)' }}>Terms of Service Outline:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" style={{ color: 'var(--muted)' }}>
                <a href="#t-acceptance" className="hover:text-[var(--brand)] transition-colors">1. Acceptance of Terms &amp; Scope</a>
                <a href="#t-license" className="hover:text-[var(--brand)] transition-colors">2. Permitted Use &amp; License Grant</a>
                <a href="#t-ownership" className="hover:text-[var(--brand)] transition-colors">3. User Data &amp; Source Code Ownership</a>
                <a href="#t-acceptable-use" className="hover:text-[var(--brand)] transition-colors">4. Acceptable Use Policy &amp; Prohibitions</a>
                <a href="#t-ip" className="hover:text-[var(--brand)] transition-colors">5. Codepackr Intellectual Property</a>
                <a href="#t-warranty" className="hover:text-[var(--brand)] transition-colors">6. Warranty Disclaimer (&ldquo;As Is&rdquo;)</a>
                <a href="#t-liability" className="hover:text-[var(--brand)] transition-colors">7. Limitation of Liability</a>
                <a href="#t-third-party" className="hover:text-[var(--brand)] transition-colors">8. Third-Party Links &amp; Dependencies</a>
                <a href="#t-modifications" className="hover:text-[var(--brand)] transition-colors">9. Service Modifications &amp; Updates</a>
                <a href="#t-governing" className="hover:text-[var(--brand)] transition-colors">10. Governing Law &amp; Severability</a>
              </div>
            </div>

            {/* Section 1 */}
            <section id="t-acceptance" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  1. Acceptance of Terms &amp; Scope
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  By accessing, browsing, or utilizing the website <strong style={{ color: 'var(--ink)' }}>https://www.codepackr.com</strong>, including all associated developer tools, encoders, formatters, calculators, and utilities (collectively, the &ldquo;Service&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our Privacy Policy.
                </p>
                <p className="text-xs">
                  If you do not agree with any part of these Terms, you must immediately discontinue use of the Service.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="t-license" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  2. Permitted Use &amp; License Grant
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  Codepackr grants you a worldwide, royalty-free, non-exclusive, revocable license to access and use our web utilities for:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Personal &amp; Educational Projects:</strong> Learning, inspecting, debugging, and testing algorithms or data formats.</li>
                  <li><strong>Commercial &amp; Enterprise Software Engineering:</strong> Formatting production configs, validating EDI files, converting formats, decoding tokens, and checking diffs within commercial software development workflows.</li>
                  <li><strong>No Paywalls or Quotas:</strong> Tools are provided free of charge without artificial usage limits, subscription tiers, or mandatory account creation.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="t-ownership" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  3. User Data &amp; Source Code Ownership
                </h2>
              </div>
              <div
                className="p-4 rounded-2xl border space-y-2 text-sm leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <strong style={{ color: 'var(--ink)' }}>You Retain 100% Intellectual Property Rights:</strong>
                <p style={{ color: 'var(--muted)' }}>
                  You retain exclusive ownership, title, copyright, and all associated rights to any source code, proprietary algorithms, trade secrets, configurations, financial inputs, EDI transaction messages, and documents you process through Codepackr.
                </p>
                <p className="text-xs pt-1" style={{ color: 'var(--muted)' }}>
                  Codepackr asserts <strong>no intellectual property claims, licenses, or rights</strong> over user-submitted inputs or outputs generated through your usage of the tools.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="t-acceptable-use" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  4. Acceptable Use Policy &amp; Prohibitions
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  You agree to use Codepackr responsibly and in compliance with all applicable local, national, and international laws. You agree NOT to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>Deploy automated scripts, bots, scrapers, or high-frequency automated attacks designed to degrade, overburden, or disrupt site availability for other developers.</li>
                  <li>Attempt to bypass, disable, or circumvent any security safeguards, rate limits, or advertising containers.</li>
                  <li>Attempt to distribute malicious software, trojans, ransomware, or malicious browser exploits through the platform.</li>
                  <li>Misrepresent yourself as Codepackr or create deceptive phishing clones that infringe upon our brand identity.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="t-ip" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  5. Codepackr Intellectual Property
                </h2>
              </div>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  The Codepackr name, logo, graphic identity, UI architecture, styling compositions, source code repository, documentation, and metadata are the intellectual property of Codepackr and its maintainers, protected by copyright, trademark, and open-source licensing provisions.
                </p>
                <p className="text-xs">
                  Third-party trademarks (such as JSON, XML, EDI X12, JWT, GitHub, LinkedIn) are the property of their respective owners and referenced purely for descriptive identification purposes.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="t-warranty" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  6. Warranty Disclaimer (&ldquo;As Is&rdquo; &amp; &ldquo;As Available&rdquo;)
                </h2>
              </div>
              <div
                className="p-4 rounded-2xl border space-y-2 text-xs leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
              >
                <p className="uppercase font-semibold tracking-wider" style={{ color: 'var(--ink)' }}>
                  Important Legal Disclaimer:
                </p>
                <p>
                  THE SERVICE AND ALL INCLUDED TOOLS, CALCULATORS, CONVERTERS, FORMATTERS, AND DOCUMENTATION ARE PROVIDED ON AN <strong style={{ color: 'var(--ink)' }}>&ldquo;AS IS&rdquo;</strong> AND <strong style={{ color: 'var(--ink)' }}>&ldquo;AS AVAILABLE&rdquo;</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.
                </p>
                <p>
                  WHILE WE STRIVE FOR MATHEMATICAL AND SYNTACTIC PRECISION ACROSS ALL UTILITIES, CODEPACKR DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, DEFECT-FREE, OR COMPATIBLE WITH EVERY SYSTEM SPECIFICATION. DEVELOPERS ARE STRONGLY ADVISED TO AUDIT AND VERIFY OUTPUTS (INCLUDING CRYPTOGRAPHIC HASHES, FINANCIAL FORMULAS, AND EDI 997 ACKNOWLEDGEMENTS) IN STAGING ENVIRONMENTS BEFORE PRODUCTION APPLICATION.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="t-liability" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-red-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  7. Limitation of Liability
                </h2>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CODEPACKR, ITS MAINTAINERS, AFFILIATES, OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES (INCLUDING DAMAGES FOR LOSS OF PROFITS, DATA CORRUPTION, SYSTEM DOWNTIME, LOSS OF GOODWILL, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE TOOLS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            {/* Section 8 */}
            <section id="t-third-party" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  8. Third-Party Links &amp; External Services
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Our website may provide hyperlinks to third-party web properties (such as GitHub, X / Twitter, LinkedIn, YouTube, Instagram, or technical standards bodies). Codepackr does not endorse, sponsor, or control these external platforms and assumes no responsibility for their content, availability, or privacy practices.
              </p>
            </section>

            {/* Section 9 */}
            <section id="t-modifications" className="space-y-3 scroll-mt-20">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500 shrink-0" />
                <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  9. Service Modifications &amp; Updates
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                We reserve the right to add new tools, refine existing engines, update UI layouts, or modify these Terms at our discretion. Any revisions will be published on this page with an updated revision date. Continued usage of the Service after changes constitute acceptance of the modified Terms.
              </p>
            </section>

            {/* Section 10 */}
            <section id="t-governing" className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                10. Governing Law &amp; Severability
              </h2>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  These Terms shall be interpreted in accordance with applicable legal principles governing internet services. If any provision of these Terms is deemed unlawful, void, or unenforceable, that provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onContactClick ? (
                  <button
                    onClick={onContactClick}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    Contact Support &amp; Feedback
                  </button>
                ) : (
                  <a
                    href="/contact.html"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    Contact Support &amp; Feedback
                  </a>
                )}
                <button
                  onClick={() => setActiveTab('privacy')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:border-[var(--brand)] cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  View Privacy Policy &rarr;
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
