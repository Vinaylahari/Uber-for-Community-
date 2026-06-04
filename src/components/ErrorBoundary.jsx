import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-gray-100">
            <h1 className="text-2xl font-bold text-danger mb-2">Oops!</h1>
            <p className="text-gray-600 mb-4">
              {this.state.message || 'An unexpected error occurred. Please refresh and try again.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold min-h-[48px]"
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
