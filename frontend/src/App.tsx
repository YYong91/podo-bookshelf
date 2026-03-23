import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
