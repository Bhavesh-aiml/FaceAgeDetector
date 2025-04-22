import React from 'react';
import { Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Attempt to reload models or reset state
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // Default reload behavior if no custom handler
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 text-center">
          <Alert variant="danger">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>
              We encountered an error while processing your request. This might be due to a problem with:
            </p>
            <ul className="list-unstyled">
              <li>- The face detection models failing to load</li>
              <li>- The image format or size</li>
              <li>- Browser compatibility issues</li>
            </ul>
            <hr />
            <div className="d-flex justify-content-center">
              <Button variant="outline-light" onClick={this.handleReset}>
                Reset Application
              </Button>
            </div>
          </Alert>
          
          {/* Show technical details if in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-3 text-start">
              <details>
                <summary>Technical Details (Development Only)</summary>
                <p className="text-danger">{this.state.error.toString()}</p>
                <pre className="bg-dark p-3 text-light">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;