/**
 * Error Boundary component for capturing React errors and sending them to logging system.
 * 
 * This component catches JavaScript errors anywhere in the child component tree,
 * logs those errors to the backend logging system, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';
import { log } from './logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging system
    log.error('React Error Boundary caught an error', error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorStack: error.stack,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    // Reset the error boundary
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Log the retry attempt
    log.info('User clicked retry after error boundary activation', {
      action: 'error_boundary_retry',
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              An unexpected error occurred. This has been automatically reported to help us improve the application.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" component="pre" sx={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
          </Alert>
          
          <Button 
            variant="contained" 
            onClick={this.handleRetry}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;