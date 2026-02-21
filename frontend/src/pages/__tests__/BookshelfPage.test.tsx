import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookshelfPage from "../BookshelfPage";
import { getBooks, createBook } from "../../api/books";
import { searchBooks, searchBookByIsbn } from "../../api/search";
import type { Book } from "../../types";

vi.mock("../../api/books", () => ({ getBooks: vi.fn(), createBook: vi.fn() }));
vi.mock("../../api/search", () => ({ searchBooks: vi.fn(), searchBookByIsbn: vi.fn() }));
vi.mock("../../components/BarcodeScanner", () => ({ default: () => null }));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    user: { id: "1", name: "테스트" },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

const mockBook: Book = {
  id: "1",
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

function renderPage() {
  return render(
    <MemoryRouter>
      <BookshelfPage />
    </MemoryRouter>
  );
}

describe("BookshelfPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBooks).mockResolvedValue({ items: [], total: 0 });
  });

  it("renders loading state initially", () => {
    vi.mocked(getBooks).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("renders empty state when no books", async () => {
    vi.mocked(getBooks).mockResolvedValue({ items: [], total: 0 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("책장")).toBeInTheDocument();
    });
  });

  it("renders book list", async () => {
    const book2: Book = {
      ...mockBook,
      id: "2",
      title: "강아지똥",
      author: "권정생",
    };
    vi.mocked(getBooks).mockResolvedValue({ items: [mockBook, book2], total: 2 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("구름빵")).toBeInTheDocument();
      expect(screen.getByText("강아지똥")).toBeInTheDocument();
    });
  });

  it("opens add modal on button click", async () => {
    vi.mocked(getBooks).mockResolvedValue({ items: [], total: 0 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("책장")).toBeInTheDocument();
    });
    const addButton = screen.getByRole("button", { name: /새 책 추가/i });
    await userEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("책 제목으로 검색...")).toBeInTheDocument();
    });
  });

  it("calls getBooks on mount", async () => {
    renderPage();
    await waitFor(() => {
      expect(getBooks).toHaveBeenCalled();
    });
  });
});
