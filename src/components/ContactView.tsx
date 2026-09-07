import React, { useState, useRef } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, ShieldCheck, ArrowLeft, Loader2, AlertCircle, Settings, Check, RefreshCw } from 'lucide-react';
import { safeLocalStorage } from '../lib/storage';

interface ContactViewProps {
  onBack: () => void;
}

const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxLtRspOxZaKhGdikBBlAjJk3ndSibOs0t3Im2Xf-K0podjAPItb90iOA9mDjRAbuT_Bg/exec';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ContactView: React.FC<ContactViewProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Feedback & General Comment');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Script URL priority: localStorage override > Vite env > default deployed script
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    return (
      safeLocalStorage.getItem('codepackr_contact_script_url') ||
      (import.meta.env.VITE_CONTACT_GOOGLE_SCRIPT_URL as string) ||
      DEFAULT_SCRIPT_URL
    );
  });
  const [showConfig, setShowConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(scriptUrl);
  const hiddenFormRef = useRef<HTMLFormElement>(null);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrlInput.trim();
    const finalUrl = trimmed || DEFAULT_SCRIPT_URL;
    setScriptUrl(finalUrl);
    setCustomUrlInput(finalUrl);
    safeLocalStorage.setItem('codepackr_contact_script_url', finalUrl);
    setShowConfig(false);
    setError(null);
  };

  const handleResetUrl = () => {
    setScriptUrl(DEFAULT_SCRIPT_URL);
    setCustomUrlInput(DEFAULT_SCRIPT_URL);
    safeLocalStorage.removeItem('codepackr_contact_script_url');
    setShowConfig(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const trimmedName = name.trim() || 'Anonymous Developer';

    // Validate email according to Google Apps Script regex
    if (!trimmedEmail) {
      setError('Please enter your email address so we can reply to your message.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. yourname@domain.com).');
      return;
    }

    if (!trimmedMessage) {
      setError('Please enter a message describing your feedback or request.');
      return;
    }

    const targetUrl = scriptUrl.trim() || DEFAULT_SCRIPT_URL;
    setIsSubmitting(true);

    const computedSubject = subject.trim()
      ? `[${category}] ${subject.trim()}`
      : `[${category}] Note from ${trimmedName}`;

    try {
      // 1. Build form URL parameters matching Google Apps Script doPost parameter names:
      // name, email, subject, message
      const params = new URLSearchParams();
      params.append('name', trimmedName);
      params.append('email', trimmedEmail);
      params.append('subject', computedSubject);
      params.append('message', trimmedMessage);
      params.append('category', category);
      params.append('timestamp', new Date().toISOString());

      // 2. Submit via fetch with mode: 'no-cors'
      const fetchPromise = fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      // 3. Dual-dispatch via hidden iframe form submission for 100% browser compatibility
      if (hiddenFormRef.current) {
        hiddenFormRef.current.action = targetUrl;
        const nameInput = hiddenFormRef.current.elements.namedItem('name') as HTMLInputElement;
        const emailInput = hiddenFormRef.current.elements.namedItem('email') as HTMLInputElement;
        const subjectInput = hiddenFormRef.current.elements.namedItem('subject') as HTMLInputElement;
        const messageInput = hiddenFormRef.current.elements.namedItem('message') as HTMLTextAreaElement;

        if (nameInput) nameInput.value = trimmedName;
        if (emailInput) emailInput.value = trimmedEmail;
        if (subjectInput) subjectInput.value = computedSubject;
        if (messageInput) messageInput.value = trimmedMessage;

        try {
          hiddenFormRef.current.submit();
        } catch (iframeErr) {
          console.warn('Hidden iframe submit fallback warning:', iframeErr);
        }
      }

      await fetchPromise;

      // Allow a brief moment for transmission
      await new Promise((resolve) => setTimeout(resolve, 600));

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Failed to submit message to Google Apps Script:', err);
      // Even if fetch threw an opaque error, the hidden iframe dispatched.
      // But if network is completely down:
      setError(
        'There was a network transmission issue. You can click below to send your feedback directly via email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mailtoFallback = `mailto:codepackr@gmail.com,tnavkum@gmail.com?subject=${encodeURIComponent(
    subject.trim() ? `[${category}] ${subject.trim()}` : `[${category}] from ${name || 'Developer'}`
  )}&body=${encodeURIComponent(
    `Name: ${name || 'Anonymous'}\nEmail: ${email || 'Not provided'}\nCategory: ${category}\n\nMessage:\n${message}`
  )}`;

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Hidden iframe and form for infallible dual-dispatch */}
      <iframe
        name="codepackr_hidden_script_iframe"
        id="codepackr_hidden_script_iframe"
        title="Hidden Script Worker"
        className="hidden"
        style={{ display: 'none', width: 0, height: 0, border: 0 }}
      />
      <form
        ref={hiddenFormRef}
        target="codepackr_hidden_script_iframe"
        method="POST"
        className="hidden"
        style={{ display: 'none' }}
      >
        <input type="hidden" name="name" />
        <input type="hidden" name="email" />
        <input type="hidden" name="subject" />
        <textarea name="message" className="hidden" />
      </form>

      <button
        id="btn-back-to-tools"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold mb-6 hover:underline cursor-pointer"
        style={{ color: 'var(--brand)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Developer Tools</span>
      </button>

      <div
        id="contact-card-container"
        className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--brand)' }}>
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                Contact & Feedback
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Have a suggestion, found a bug, or want a new developer utility added to Codepackr? Send a message directly to our inbox!
            </p>
          </div>

          <button
            id="btn-toggle-script-config"
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            title="Google Apps Script Endpoint Settings"
            className="p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            style={{
              backgroundColor: showConfig ? 'var(--surface-3)' : 'var(--surface-2)',
              borderColor: 'var(--line)',
              color: 'var(--muted)',
            }}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Endpoint</span>
          </button>
        </div>

        {/* Endpoint Configuration Panel */}
        {showConfig && (
          <form
            id="form-script-config"
            onSubmit={handleSaveUrl}
            className="p-4 rounded-2xl border space-y-3 text-xs"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Google Apps Script Web App Endpoint</span>
              </span>
              <button
                type="button"
                onClick={handleResetUrl}
                className="text-[11px] flex items-center gap-1 text-sky-500 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Default</span>
              </button>
            </div>
            <p style={{ color: 'var(--muted)' }}>
              Connected to deployed Google Apps Script. Submissions trigger automated HTML notification emails to{' '}
              <strong style={{ color: 'var(--ink)' }}>codepackr@gmail.com</strong>.
            </p>
            <div className="flex gap-2">
              <input
                id="input-script-url"
                type="url"
                required
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 p-2.5 rounded-xl border outline-none font-mono text-[11px]"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
              <button
                id="btn-save-script-url"
                type="submit"
                className="px-4 py-2.5 rounded-xl font-semibold text-white whitespace-nowrap cursor-pointer"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                Save
              </button>
            </div>
          </form>
        )}

        {error && (
          <div
            id="contact-error-banner"
            className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#dc2626' }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-medium leading-relaxed">{error}</p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={mailtoFallback}
                  className="inline-flex items-center gap-1.5 font-semibold underline hover:opacity-80"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send via your Email App (codepackr@gmail.com)</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {submitted ? (
          <div
            id="contact-success-state"
            className="p-8 rounded-2xl border text-center space-y-4"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
                Message Dispatched!
              </h3>
              <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
                Your message has been delivered to <strong>codepackr@gmail.com</strong>. Thank you for helping make Codepackr better.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                id="btn-send-another"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                  setSubject('');
                }}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white shadow-sm cursor-pointer hover:opacity-90"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                Send Another Message
              </button>
              <button
                id="btn-back-home"
                onClick={onBack}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Back to Tools
              </button>
            </div>
          </div>
        ) : (
          <form id="form-contact-developer" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  YOUR NAME <span className="font-normal opacity-70">(OPTIONAL)</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kumar"
                  disabled={isSubmitting}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none disabled:opacity-60"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  YOUR EMAIL <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. developer@example.com"
                  disabled={isSubmitting}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none disabled:opacity-60"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contact-category" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  TOPIC CATEGORY
                </label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none disabled:opacity-60"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="Feedback & General Comment">Feedback & General</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="New Tool Request">New Tool Request</option>
                  <option value="Feature Improvement">Feature Improvement</option>
                  <option value="Security or Privacy">Security or Privacy</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="contact-subject" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  SUBJECT LINE <span className="font-normal opacity-70">(OPTIONAL)</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Suggestion for Regex Tester or JSON Formatter bug"
                  disabled={isSubmitting}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none disabled:opacity-60"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                MESSAGE <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Describe your suggestion, tool request, or bug details..."
                disabled={isSubmitting}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none resize-y disabled:opacity-60"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs py-1" style={{ color: 'var(--muted)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sends directly to codepackr@gmail.com via secure webhook.</span>
              </div>
              <a
                href={mailtoFallback}
                className="hover:underline flex items-center gap-1 text-[11px] shrink-0"
                style={{ color: 'var(--brand)' }}
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Direct Mailto</span>
              </a>
            </div>

            <button
              id="btn-submit-contact-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-md hover:opacity-90 disabled:opacity-60 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting Message to codepackr@gmail.com...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
