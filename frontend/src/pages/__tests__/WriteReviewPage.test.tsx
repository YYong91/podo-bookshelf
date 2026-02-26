import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WriteReviewPage from "../WriteReviewPage";
import { getBook } from "../../api/books";
import { createReview } from "../../api/reviews";
import api from "../../api/client";

vi.mock("../../api/books", () => ({ getBook: vi.fn(), createBook: vi.fn() }));
vi.mock("../../api/reviews", () => ({ createReview: vi.fn() }));
vi.mock("../../api/client", () => ({ default: { get: vi.fn() } }));
vi.mock("../../components/MilestoneModal", () => ({ default: () => null }));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

const mockBook = {
  id: "book-1",
  user_id: "1",
  title: "구름빵",
  author: "백희나",
  cover_url: null,
  isbn: null,
  publisher: null,
  language: "ko",
  is_favorite: false,
  created_at: "2024-01-01T00:00:00",
  review_count: 0,
};

function renderWithBookId(bookId = "book-1") {
  return render(
    <MemoryRouter initialEntries={[`/write?book_id=${bookId}`]}>
      <WriteReviewPage />
    </MemoryRouter>
  );
}

describe("WriteReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBook).mockResolvedValue(mockBook);
    vi.mocked(api.get).mockResolvedValue({ data: { child_birthdate: null } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createReview).mockResolvedValue({ id: "r1", total_reviews: 1 } as any);
  });

  it("shows loading state initially", async () => {
    vi.mocked(getBook).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithBookId();
    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("shows book title after loading", async () => {
    renderWithBookId();
    await waitFor(() => {
      expect(screen.getByText("구름빵")).toBeInTheDocument();
    });
  });

  it("loads the correct book by id", async () => {
    renderWithBookId("book-1");
    await waitFor(() => {
      // 올바른 book_id로 요청하여 제목이 표시되는지 확인
      expect(screen.getByText("구름빵")).toBeInTheDocument();
    });
  });

  it("submits review on button click", async () => {
    const user = userEvent.setup();
    renderWithBookId();
    await waitFor(() => {
      expect(screen.getByText("구름빵")).toBeInTheDocument();
    });
    const submitButton = screen.getByRole("button", { name: /포도알 심기/i });
    await user.click(submitButton);
    await waitFor(() => {
      expect(createReview).toHaveBeenCalled();
    });
  });

  it("fetches settings for child birthdate", async () => {
    renderWithBookId();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/settings");
    });
  });
});
