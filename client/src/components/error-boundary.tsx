import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      console.error('Production error:', { error, errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" data-testid="error-boundary">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-4">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                <p className="text-muted-foreground">
                  We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full" data-testid="button-retry">
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="w-full" data-testid="button-reload">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundaries
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}