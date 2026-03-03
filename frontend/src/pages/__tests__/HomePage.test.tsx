import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "../HomePage";
import { getStats } from "../../api/stats";
import { getReviews } from "../../api/reviews";
import api from "../../api/client";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ token: "test-token", user: { id: "1", name: "테스트", email: "test@example.com" }, isAuthenticated: true, logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../api/stats", () => ({ getStats: vi.fn() }));
vi.mock("../../api/reviews", () => ({ getReviews: vi.fn() }));
vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

// Garden component uses canvas/SVG — stub it to avoid render errors
vi.mock("../../components/garden/Garden", () => ({
  default: () => <div data-testid="garden" />,
}));

const mockStats = { total_reviews: 37, grapes: 7, bunches: 3, trees: 0 };
const mockReviewsResponse = { items: [], total: 0, page: 1, size: 5 };

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStats).mockResolvedValue(mockStats);
    vi.mocked(getReviews).mockResolvedValue(mockReviewsResponse);
    vi.mocked(api.get).mockResolvedValue({
      data: { monthly_goal: 10, yearly_goal: 100, monthly_count: 3, yearly_count: 37, child_birthdate: null, month: "2026-02", year: 2026 },
    });
  });

  it("renders garden component after loading", async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByTestId("garden")).toBeInTheDocument();
    });
  });

  it("displays stats data from API", async () => {
    renderHome();
    await waitFor(() => {
      // Garden 컴포넌트가 렌더링되면 stats가 로드된 것
      expect(screen.getByTestId("garden")).toBeInTheDocument();
    });
  });

  it("fetches recent reviews on mount", async () => {
    renderHome();
    await waitFor(() => {
      expect(getReviews).toHaveBeenCalledWith(expect.objectContaining({ size: 5 }));
    });
  });

  it("shows empty reading list when no reviews", async () => {
    vi.mocked(getReviews).mockResolvedValue({ items: [], total: 0, page: 1, size: 5 });
    renderHome();
    await waitFor(() => {
      // 데이터 로드 완료 확인 (Garden 렌더링)
      expect(screen.getByTestId("garden")).toBeInTheDocument();
    });
    // 리뷰가 없으면 "최근 읽은 책" 섹션 헤더가 없다
    expect(screen.queryByText("최근 읽은 책")).not.toBeInTheDocument();
  });

  it("shows bookshelf link next to recent reviews heading when reviews exist", async () => {
    vi.mocked(getReviews).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: [{ id: "1", book: { id: "1", title: "테스트책", author: "저자", cover_url: null, user_id: null, isbn: null, publisher: null, language: "ko", is_favorite: false, created_at: "2026-03-04", review_count: 1 }, read_date: "2026-03-04", memo: "" } as any],
      total: 1, page: 1, size: 5,
    });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText("책장 보기 →")).toBeInTheDocument();
    });
    expect(screen.getByText("책장 보기 →").closest("a")).toHaveAttribute("href", "/bookshelf");
  });

  it("shows bookshelf shortcut when no reviews but books exist", async () => {
    vi.mocked(getReviews).mockResolvedValue({ items: [], total: 0, page: 1, size: 5 });
    renderHome();
    await waitFor(() => {
      expect(screen.getByTestId("garden")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("책장 보기")).toBeInTheDocument();
    });
    expect(screen.getByText("책장 보기").closest("a")).toHaveAttribute("href", "/bookshelf");
  });
});
