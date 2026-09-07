import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Codepackr ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 text-[var(--ink)]">
          <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--ink)]">
                Application Rendering Issue
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                An unexpected state or cache conflict prevented this page from rendering properly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[var(--brand)] text-white font-medium text-sm rounded-xl hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                id="btn-error-home"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface-muted)] text-[var(--ink)] font-medium text-sm rounded-xl border border-[var(--line)] hover:bg-[var(--surface)] transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
