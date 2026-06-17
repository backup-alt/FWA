import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if the error is a dynamic import failure (chunk load error)
    // Common messages: "Failed to fetch dynamically imported module", "Loading chunk X failed"
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      (error?.message && /Failed to fetch dynamically imported module|Loading chunk \d+ failed/i.test(error.message));
      
    if (isChunkLoadError) {
      // It's a new version deployed on the server and the client has an old cached index.html
      // Force a hard reload from the server
      window.location.reload(true);
    } else {
      // If it's a runtime error, it could be caused by corrupted sessionStorage drafts.
      // Clear the draft to prevent a persistent crash loop, then log.
      try {
        sessionStorage.removeItem('add_customer_form_draft');
      } catch (e) {
        // ignore
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="text-center max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              We encountered an unexpected error. This usually happens after an update.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-left rounded-lg overflow-auto border border-red-200 dark:border-red-800 font-mono text-xs max-h-64">
                <strong>{this.state.error.toString()}</strong>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
