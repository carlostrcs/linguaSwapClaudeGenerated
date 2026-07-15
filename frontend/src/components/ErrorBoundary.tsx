import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide safety net. React unmounts the whole tree when a render throws, which without a boundary
 * means a permanent blank page the user cannot recover from. This catches that, shows a plain
 * fallback, and — crucially — offers a "reset" that clears localStorage, since corrupt local state
 * is the most likely cause of a crash that reproduces on every load.
 *
 * Deliberately self-contained: a class component (error boundaries must be), no i18n/theme/router
 * dependencies and inline styles, so it still renders even if a provider above the app is what
 * threw. Kept as the outermost wrapper for that reason.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it for debugging; a real logging backend can hook in here later.
    console.error('Unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      /* ignore — storage may be unavailable */
    }
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem', lineHeight: 1.5 }}>
            The app hit an unexpected error. Reloading usually fixes it. If it keeps happening, reset
            the app — this clears local data and signs you out, but your account and libraries are
            safe on the server.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: '#6366f1',
                color: 'white',
                fontSize: '1rem',
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                border: '1px solid #475569',
                cursor: 'pointer',
                background: 'transparent',
                color: '#e2e8f0',
                fontSize: '1rem',
              }}
            >
              Reset the app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
