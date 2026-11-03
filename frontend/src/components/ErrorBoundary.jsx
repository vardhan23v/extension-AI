import React from 'react';
import { ErrorState } from './ui';

// Top-level boundary so a render error shows a recoverable message instead of a blank page.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState
          title="This page crashed"
          message="An unexpected error occurred. Your saved work is safe."
          onRetry={() => {
            this.setState({ error: null });
            window.location.assign('/dashboard');
          }}
        />
      </div>
    );
  }
}
