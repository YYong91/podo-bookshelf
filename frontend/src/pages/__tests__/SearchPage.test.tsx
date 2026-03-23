import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchPage from "../SearchPage";
import { searchBooks } from "../../api/search";
import { getBooks, createBook } from "../../api/books";
import type { Book, BookSearchResult } from "../../types";

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

const mockSearchResult: BookSearchResult = {
  title: "구름빵",
  author: "백희나",
  publisher: "한솔수북",
  cover_url: "",
  isbn: "9788926468531",
  language: "ko",
  is_children: false,
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
    const searchButton = screen.getByRole("button", { name: "검색" });
    await userEvent.click(searchButton);
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

  it("loads bookshelf data on mount", async () => {
    vi.mocked(getBooks).mockResolvedValue({ items: [mockBook], total: 1 });
    renderPage();
    await waitFor(() => {
      // 데이터가 로드되면 책 제목이 화면에 표시된다
      expect(screen.getByText("구름빵")).toBeInTheDocument();
    });
  });

  it("shows 상세보기 and 책장에 추가 buttons for each search result", async () => {
    vi.mocked(searchBooks).mockResolvedValue([mockSearchResult]);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "상세보기" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "책장에 추가" })).toBeInTheDocument();
    });
  });

  it("opens detail modal when 상세보기 is clicked", async () => {
    vi.mocked(searchBooks).mockResolvedValue([mockSearchResult]);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => screen.getByRole("button", { name: "상세보기" }));
    await userEvent.click(screen.getByRole("button", { name: "상세보기" }));
    expect(screen.getByText("ISBN: 9788926468531")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  it("calls createBook when 책장에 추가 is clicked directly", async () => {
    vi.mocked(searchBooks).mockResolvedValue([mockSearchResult]);
    vi.mocked(createBook).mockResolvedValue(mockBook);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => screen.getByRole("button", { name: "책장에 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "책장에 추가" }));
    await waitFor(() => {
      expect(createBook).toHaveBeenCalledWith(expect.objectContaining({ title: "구름빵" }));
    });
  });

  it("shows CTA after adding a book", async () => {
    vi.mocked(searchBooks).mockResolvedValue([mockSearchResult]);
    vi.mocked(createBook).mockResolvedValue(mockBook);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => screen.getByRole("button", { name: "책장에 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "책장에 추가" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지금 독서 기록 남기기/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "나중에" })).toBeInTheDocument();
    });
  });

  it("dismisses CTA when 나중에 is clicked", async () => {
    vi.mocked(searchBooks).mockResolvedValue([mockSearchResult]);
    vi.mocked(createBook).mockResolvedValue(mockBook);
    renderPage();
    const input = screen.getByPlaceholderText("책 제목으로 검색...");
    await userEvent.type(input, "구름빵");
    await userEvent.click(screen.getByRole("button", { name: "검색" }));
    await waitFor(() => screen.getByRole("button", { name: "책장에 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "책장에 추가" }));
    await waitFor(() => screen.getByRole("button", { name: "나중에" }));
    await userEvent.click(screen.getByRole("button", { name: "나중에" }));
    expect(screen.queryByRole("button", { name: /지금 독서 기록 남기기/ })).not.toBeInTheDocument();
  });
});
