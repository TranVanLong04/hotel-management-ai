import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Bắt lỗi runtime trong cây component con
 * Hiển thị fallback UI thay vì crash toàn bộ app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // TODO: Tích hợp logging service (Sentry, LogRocket, etc.)
    // Theo CLAUDE-RULES: KHÔNG dùng console.log
  }

  /** Reset lỗi để thử render lại cây component */
  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Ưu tiên fallback tùy chỉnh nếu có
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback mặc định — UI tiếng Việt
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Đã xảy ra lỗi
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Ứng dụng gặp sự cố. Vui lòng thử lại.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary px-4 py-2"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
