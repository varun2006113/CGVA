import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-xl shadow-lg font-sans text-slate-900 space-y-6">
          <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-900">Application Error</h2>
              <p className="text-xs text-rose-700 font-mono">
                A component error occurred during rendering.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-4 rounded text-xs font-mono text-rose-800 space-y-2 overflow-x-auto">
            <p className="font-bold">{this.state.error?.toString() || 'Unknown Error'}</p>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[11px] text-rose-700 whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
