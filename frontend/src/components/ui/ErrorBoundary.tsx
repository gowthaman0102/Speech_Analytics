import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl bg-surface border-[1.5px] border-border text-left space-y-4 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
            <div className="w-10 h-10 rounded-full bg-danger-soft text-danger flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                An unexpected interface error occurred. You can return to the overview page or reload.
              </p>
            </div>
            {this.state.error && (
              <pre className="p-3 bg-surface-2 rounded-xl text-xs text-text-muted overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex items-center gap-2">
              <Button onClick={this.handleReset} variant="primary" size="sm">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Back to overview</span>
              </Button>
              <Button onClick={() => window.location.reload()} variant="secondary" size="sm">
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
