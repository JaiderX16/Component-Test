import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Playground Error Boundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Component Error</h2>
          <p className="error-message">{this.state.error?.message || "Something went wrong within this component."}</p>
          <button 
            className="retry-button"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Refreshing Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
