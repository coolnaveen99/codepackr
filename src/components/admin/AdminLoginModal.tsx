import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, X, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '../../lib/useAdminAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login, resetPassword, isAuthenticated, user } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      setSuccessMsg('Authentication successful. Admin mode unlocked.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      console.warn('Admin login attempt feedback:', err?.code || err?.message || err);
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid admin credentials. Please check your email and password.');
      } else if (code === 'auth/user-not-found') {
        setError('No administrator account found with this email.');
      } else if (code === 'auth/too-many-requests') {
        setError('Access temporarily throttled due to multiple attempts. Try again in a few moments.');
      } else {
        setError(err?.message || 'Failed to authenticate administrator session.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your administrator email first, then click Forgot Password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg(`Password reset link dispatched to ${email.trim()}. Check your inbox.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to dispatch password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Admin Authentication</h2>
              <p className="text-xs text-[var(--muted)]">Unlock hidden contents, drafts &amp; governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-transparent hover:border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Already logged in notice if applicable */}
        {isAuthenticated && user && (
          <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Active session: <strong>{user.email}</strong></span>
            </div>
            <button
              onClick={() => {
                if (onSuccess) onSuccess();
                onClose();
              }}
              className="text-xs font-semibold underline hover:opacity-80 shrink-0 ml-2 cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@codepackr.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--brand)] transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={submitting}
                className="text-[11px] text-[var(--brand)] hover:underline cursor-pointer disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--brand)] transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t text-center text-xs text-[var(--muted)] flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
          <span>Protected via Firebase Auth</span>
          <button
            onClick={onClose}
            className="hover:text-[var(--ink)] hover:underline cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
