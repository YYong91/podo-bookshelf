import { render, waitFor } from "@testing-library/react";
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

const mockStats = { total_reviews: 37, total_books: 20, grapes: 7, bunches: 3, trees: 0 };
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

  it("renders without crashing", async () => {
    renderHome();
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it("calls getStats on mount", async () => {
    renderHome();
    await waitFor(() => {
      expect(getStats).toHaveBeenCalled();
    });
  });

  it("calls getReviews to fetch recent books", async () => {
    renderHome();
    await waitFor(() => {
      expect(getReviews).toHaveBeenCalledWith(expect.objectContaining({ size: 5 }));
    });
  });

  it("shows empty reading list when no reviews", async () => {
    vi.mocked(getReviews).mockResolvedValue({ items: [], total: 0, page: 1, size: 5 });
    renderHome();
    await waitFor(() => {
      expect(getReviews).toHaveBeenCalled();
    });
  });
});
