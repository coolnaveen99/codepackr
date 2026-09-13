import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Scale, AlertOctagon, CheckCircle2, Lock, Building, FileText } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onContactClick: () => void;
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
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold hover:underline cursor-pointer"
        style={{ color: 'var(--brand)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Developer Tools</span>
      </button>

      <div
        className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--line)' }}>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand)' }}>
                {activeTab === 'privacy' ? <Shield className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
              </span>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                {activeTab === 'privacy' ? 'Privacy Policy & EDI Data Notice' : 'Terms of Service & Jurisdiction'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
              Last revised: September 2026 • Codepackr Legal Counsel & Regulatory Compliance
            </p>
          </div>

          <div className="flex rounded-xl border p-1 shrink-0" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'privacy' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'terms' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Terms &amp; Jurisdiction
            </button>
          </div>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 text-xs leading-relaxed"
          style={{
            backgroundColor: 'rgba(91, 82, 232, 0.06)',
            borderColor: 'var(--brand)',
            color: 'var(--ink)',
          }}
        >
          <AlertOctagon className="w-5 h-5 text-[var(--brand)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block text-[11px] text-[var(--brand)]">
              Governing Law &amp; Venue
            </span>
            <p style={{ color: 'var(--ink)' }}>
              By using Codepackr, you agree that disputes relating to these services will be handled under the laws of India
              and resolved in the competent courts of the operator&apos;s principal place of business, unless applicable consumer
              or mandatory local law provides otherwise.
            </p>
          </div>
        </div>

        {activeTab === 'privacy' && (
          <div className="space-y-8 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            <section className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <Lock className="w-4 h-4 text-emerald-500" />
                1. 100% Client-Side Sandbox &amp; Zero Server Ingestion
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                Codepackr operates as a purely browser-executed, offline-capable suite of developer tools. When you format JSON,
                validate XML/XSD schemas, compute cryptographic hashes, generate JWT tokens, process images, plan retirement goals, or process EDI payloads, the entire
                computation is carried out locally on your machine via JavaScript (ECMAScript) and WebAssembly sandboxing.
              </p>
              <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--muted)' }}>
                <li>Your source payloads, data structures, and text blocks are <strong>never transmitted</strong> to Codepackr servers.</li>
                <li>Codepackr maintains <strong>no cloud databases, backend logs, or caching proxies</strong> for processed input.</li>
                <li>Once you close or refresh your browser tab, memory allocation for your payload is instantaneously discarded by the browser.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                2. Client-Side Image Processing &amp; Financial Privacy Guarantee
              </h2>
              <div className="p-4 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <p style={{ color: 'var(--muted)' }}>
                  All image utilities and financial calculators operate 100% within your browser using client-side Web APIs, HTML5 Canvas, and WebAssembly.
                </p>
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                  Your images, photos, and personal financial profiles are never uploaded, stored, or transmitted to any external server.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <Building className="w-4 h-4 text-[var(--brand)]" />
                3. Enterprise EDI Tools &amp; Corporate Data Disclaimer
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                Codepackr provides advanced EDI processing utilities. Users frequently test documents containing commercial identifiers.
                <strong> You acknowledge that Codepackr has zero visibility into, zero ownership of, and zero liability for any proprietary data loaded into client-side tools.</strong>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                4. Information We Collect (Minimalist Analytics &amp; Contact Webhooks)
              </h2>
              <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--muted)' }}>
                <li><strong>Anonymous Traffic Telemetry:</strong> via Google Analytics 4 and Microsoft Clarity.</li>
                <li><strong>Feedback &amp; Inquiries:</strong> if you contact us voluntarily.</li>
                <li><strong>Local Storage Preferences:</strong> theme and bookmarks, never synced to our servers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                5. Statutory Safe Harbor Under Information Technology Act, 2000
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                Codepackr operates in compliance with Section 79 of the Information Technology Act, 2000 (India) and related intermediary guidelines.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-8 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            <section className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <FileText className="w-4 h-4 text-[var(--brand)]" />
                1. Acceptance of Terms &amp; Scope of Use
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                By accessing or using Codepackr, you enter into a contract governed by the Indian Contract Act, 1872. If you do not agree, discontinue use immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[color:var(--ink)]">
                2. Governing Law &amp; Dispute Resolution
              </h2>
              <div className="p-4 rounded-xl border space-y-3 bg-[color:var(--surface-elevated)] border-[color:var(--border)] text-[color:var(--ink)]">
                <p className="font-semibold">These terms describe how disputes related to Codepackr are governed:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Governing Law:</strong> These Terms shall be governed by the substantive laws of the Republic of India, without reference to conflict-of-law doctrines.
                  </li>
                  <li>
                    <strong>Preferred venue:</strong> Subject to mandatory consumer and other non-waivable laws, disputes are intended to be resolved in the competent courts of the operator&apos;s principal place of business.
                  </li>
                  <li>
                    <strong>Other forums:</strong> Jurisdiction of other courts is limited except where mandatory law requires otherwise.
                  </li>
                </ol>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                3. &quot;As-Is&quot; Warranty Disclaimer &amp; Limitation of Liability
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                All tools are provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranty of any kind.
                Maximum aggregate liability of Codepackr shall not exceed <strong>INR ₹100</strong>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                4. Third-Party Trademarks &amp; Non-Affiliation
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                Format names and standards referenced on Codepackr are properties of their respective organizations. Codepackr is independent and unaffiliated.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                5. Indemnification
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                You agree to indemnify Codepackr from claims arising from your use of the tools or breach of these Terms.
              </p>
            </section>
          </div>
        )}

        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Codepackr — Local, Private, In-Browser Engineering</span>
          </div>
          <button onClick={onContactClick} className="font-semibold text-[var(--brand)] hover:underline cursor-pointer">
            Have legal or compliance queries? Contact Developer
          </button>
        </div>
      </div>
    </div>
  );
};
