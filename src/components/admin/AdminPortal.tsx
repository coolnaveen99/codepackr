import React, { useState } from 'react';
import { useAdminAuth } from '../../lib/useAdminAuth';
import { useToolGovernance } from '../../lib/useToolGovernance';
import { TOOLS } from '../../data/tools';
import { ToolStatus, ToolGovernanceItem } from '../../types/admin';
import {
  Shield,
  Lock,
  LogOut,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
} from 'lucide-react';

interface AdminPortalProps {
  onBack: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBack }) => {
  const { user, isAuthenticated, loading: authLoading, login, logout, resetPassword } = useAdminAuth();
  const { governance, getToolStatus, saveToolStatus } = useToolGovernance();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Governance Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [savingToolId, setSavingToolId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setLoginError('Please enter your email above to receive a password reset link.');
      return;
    }
    setSubmitting(true);
    setLoginError(null);
    try {
      await resetPassword(email);
      setLoginSuccess(`Password reset email dispatched to ${email}. Check your inbox.`);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to dispatch reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (toolId: string, newStatus: ToolStatus) => {
    setSavingToolId(toolId);
    try {
      await saveToolStatus(toolId, { status: newStatus }, user?.email || 'admin');
    } catch (err: any) {
      console.error('Failed to save status:', err);
    } finally {
      setSavingToolId(null);
    }
  };

  const handleVisibilityToggle = async (toolId: string) => {
    const current = getToolStatus(toolId);
    const newVis = current.visibility === 'public' ? 'admin_only' : 'public';
    setSavingToolId(toolId);
    try {
      await saveToolStatus(toolId, { visibility: newVis }, user?.email || 'admin');
    } catch (err: any) {
      console.error('Failed to toggle visibility:', err);
    } finally {
      setSavingToolId(null);
    }
  };

  const handleNoticeChange = async (toolId: string, message: string) => {
    try {
      await saveToolStatus(toolId, { noticeMessage: message }, user?.email || 'admin');
    } catch (err) {
      console.error('Failed to save notice:', err);
    }
  };

  // Filter tools
  const filteredTools = TOOLS.filter((tool) => {
    const status = getToolStatus(tool.id).status;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Calculate stats
  const totalTools = TOOLS.length;
  const activeCount = TOOLS.filter((t) => getToolStatus(t.id).status === 'active').length;
  const maintenanceCount = TOOLS.filter((t) => getToolStatus(t.id).status === 'maintenance').length;
  const hiddenCount = TOOLS.filter((t) => getToolStatus(t.id).status === 'hidden').length;
  const betaCount = TOOLS.filter((t) => getToolStatus(t.id).status === 'beta').length;

  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--brand)]" />
          <span>Authenticating admin session...</span>
        </div>
      </div>
    );
  }

  // View 1: Login Form
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div
          className="p-8 rounded-2xl border shadow-xl space-y-6"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)]">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              Codepackr Governance Console
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Sign in with your Firebase administrator account to control tool states, maintenance notices, and visibility.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginSuccess}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@codepackr.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--brand)]"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ink)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[var(--brand)]"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={handleResetPassword}
              disabled={submitting}
              className="text-[var(--brand)] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
            <button onClick={onBack} className="hover:underline cursor-pointer" style={{ color: 'var(--muted)' }}>
              Return to Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Tool Governance Matrix
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Console Header */}
      <div
        className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                Tool Governance &amp; Lifecycle
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Firestore Live
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Signed in as: <span className="font-mono text-[var(--ink)]">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl text-xs border hover:border-[var(--brand)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Public View
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-3.5 rounded-xl border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--ink)' }}>
            {totalTools}
          </div>
          <div className="text-[11px] text-[var(--muted)]">Total Catalog</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-emerald-500/20">
          <div className="text-xl font-bold font-mono text-emerald-500">{activeCount}</div>
          <div className="text-[11px] text-[var(--muted)]">Active Live</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-amber-500/20">
          <div className="text-xl font-bold font-mono text-amber-500">{maintenanceCount}</div>
          <div className="text-[11px] text-[var(--muted)]">Maintenance</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-blue-500/20">
          <div className="text-xl font-bold font-mono text-blue-500">{betaCount}</div>
          <div className="text-[11px] text-[var(--muted)]">Beta</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-zinc-500/20">
          <div className="text-xl font-bold font-mono text-zinc-400">{hiddenCount}</div>
          <div className="text-[11px] text-[var(--muted)]">Hidden / Draft</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, ID, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="all">All Categories</option>
            <option value="formatters">Formatters</option>
            <option value="converters">Converters</option>
            <option value="validators">Validators</option>
            <option value="edi">EDI Tools</option>
            <option value="calculators">Calculators</option>
            <option value="encoders">Encoders</option>
            <option value="utilities">Utilities</option>
            <option value="text">Text Tools</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="maintenance">Maintenance</option>
            <option value="beta">Beta Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Tools Table */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-[var(--surface-3)] font-mono text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                <th className="p-3.5">Tool Name &amp; ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Lifecycle Status</th>
                <th className="p-3.5">Visibility</th>
                <th className="p-3.5">Maintenance Notice Banner</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {filteredTools.map((tool) => {
                const gov = getToolStatus(tool.id);
                const isSaving = savingToolId === tool.id;

                return (
                  <tr key={tool.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold" style={{ color: 'var(--ink)' }}>
                        {tool.name}
                      </div>
                      <div className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                        {tool.id}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono uppercase text-[10px]" style={{ color: 'var(--muted)' }}>
                      {tool.category}
                    </td>

                    <td className="p-3.5">
                      <select
                        value={gov.status}
                        disabled={isSaving}
                        onChange={(e) => handleStatusChange(tool.id, e.target.value as ToolStatus)}
                        className={`px-2.5 py-1 rounded-lg border font-semibold text-xs cursor-pointer ${
                          gov.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : gov.status === 'maintenance'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : gov.status === 'beta'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="beta">Beta</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleVisibilityToggle(tool.id)}
                        disabled={isSaving}
                        className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          gov.visibility === 'public'
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                            : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                        }`}
                      >
                        {gov.visibility === 'public' ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Admin Only</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <input
                        type="text"
                        defaultValue={gov.noticeMessage || ''}
                        onBlur={(e) => handleNoticeChange(tool.id, e.target.value)}
                        placeholder="Optional notice shown to users..."
                        className="w-full px-2.5 py-1 rounded-lg border text-xs focus:outline-none focus:border-[var(--brand)]"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
