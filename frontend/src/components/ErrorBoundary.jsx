import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
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
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              We encountered an unexpected error. This usually happens after an update.
            </p>
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
