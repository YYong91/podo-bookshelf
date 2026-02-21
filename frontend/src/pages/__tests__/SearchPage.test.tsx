import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchPage from "../SearchPage";
import { searchBooks, searchBookByIsbn } from "../../api/search";
import { getBooks, createBook } from "../../api/books";
import type { Book } from "../../types";

vi.mock("../../api/search", () => ({ searchBooks: vi.fn(), searchBookByIsbn: vi.fn() }));
vi.mock("../../api/books", () => ({ getBooks: vi.fn(), createBook: vi.fn() }));
vi.mock("../../components/BarcodeScanner", () => ({ default: () => null }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() }, Toaster: () => null }));

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
      <SearchPage />
    </MemoryRouter>
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBooks).mockResolvedValue({ items: [], total: 0 });
  });

  it("renders search input", () => {
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    expect(input).toBeInTheDocument();
  });

  it("calls searchBooks when query is submitted", async () => {
    vi.mocked(searchBooks).mockResolvedValue([]);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    const searchButton = screen.getByRole("button", { name: "" });
    // Find the search button (first button with Search icon)
    const buttons = screen.getAllByRole("button");
    // Click the search button (first one after input — the magnifying glass button)
    await userEvent.click(buttons[0]);
    await waitFor(() => {
      expect(searchBooks).toHaveBeenCalledWith("구름빵");
    });
  });

  it("shows recent books from bookshelf", async () => {
    vi.mocked(getBooks).mockResolvedValue({ items: [mockBook], total: 1 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("구름빵")).toBeInTheDocument();
    });
  });

  it("calls getBooks on mount", async () => {
    renderPage();
    await waitFor(() => {
      expect(getBooks).toHaveBeenCalled();
    });
  });
});
