import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, ShieldCheck, ArrowLeft } from 'lucide-react';

interface ContactViewProps {
  onBack: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Feedback');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold mb-6 hover:underline"
        style={{ color: 'var(--brand)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Developer Tools</span>
      </button>

      <div className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
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
            Have a suggestion, found a bug, or want a new developer utility added to Codepackr? Let us know!
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl border text-center space-y-3"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
              Your message has been received. Thank you for helping make Codepackr faster, cleaner, and more helpful for developers.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage('');
              }}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Developer"
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  EMAIL ADDRESS (OPTIONAL)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                TOPIC CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option>Feedback & General Comment</option>
                <option>Bug Report</option>
                <option>New Tool Request</option>
                <option>Feature Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                MESSAGE
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your suggestion, tool request, or bug details..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl border outline-none resize-y"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs py-1" style={{ color: 'var(--muted)' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>All tool operations in Codepackr execute strictly client-side inside your browser sandbox.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-md hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
