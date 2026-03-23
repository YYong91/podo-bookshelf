import { Component, lazy, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WriteReviewPage = lazy(() => import("./pages/WriteReviewPage"));
const ReviewListPage = lazy(() => import("./pages/ReviewListPage"));
const ReviewDetailPage = lazy(() => import("./pages/ReviewDetailPage"));
const BookDetailPage = lazy(() => import("./pages/BookDetailPage"));
const BookshelfPage = lazy(() => import("./pages/BookshelfPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const AuthErrorPage = lazy(() => import("./pages/AuthErrorPage"));

function PageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-grape-400">🍇 불러오는 중...</div>
    </div>
  );
}

// 404 페이지
function NotFoundPage() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-4xl font-bold text-grape-300">404</p>
      <p className="text-warm-600">페이지를 찾을 수 없어요</p>
      <Link
        to="/"
        className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

// 전역 에러 바운더리
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold text-warm-700">문제가 발생했어요</p>
          <p className="text-sm text-warm-500">예상치 못한 오류가 발생했어요.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/auth-error" element={<AuthErrorPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/bookshelf" element={<BookshelfPage />} />
                <Route path="/write" element={<WriteReviewPage />} />
                <Route path="/reviews" element={<ReviewListPage />} />
                <Route path="/reviews/:id" element={<ReviewDetailPage />} />
                <Route path="/books/:id" element={<BookDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
