import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";

const HomePage = lazy(() => import("./pages/HomePage"));
const WriteReviewPage = lazy(() => import("./pages/WriteReviewPage"));
const ReviewListPage = lazy(() => import("./pages/ReviewListPage"));
const ReviewDetailPage = lazy(() => import("./pages/ReviewDetailPage"));
const BookDetailPage = lazy(() => import("./pages/BookDetailPage"));
const BookshelfPage = lazy(() => import("./pages/BookshelfPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));

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
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/bookshelf" element={<BookshelfPage />} />
            <Route path="/write" element={<WriteReviewPage />} />
            <Route path="/reviews" element={<ReviewListPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
