import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { searchBooks, searchBookByIsbn } from "../api/search";
import { getBooks, createBook } from "../api/books";
import type { Book, BookSearchResult } from "../types";

/** 검색 페이지의 데이터 페칭 + 상태 관리 훅 */
export function useBookSearch() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // 직접 입력 필드
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPublisher, setManualPublisher] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [lastAddedBook, setLastAddedBook] = useState<Book | null>(null);

  // 최근 추가한 책 로드
  useEffect(() => {
    getBooks({ sort: "newest", limit: 4 }).then(({ items }) => setRecentBooks(items));
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setShowManual(false);
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const handleAddBook = async (result: BookSearchResult) => {
    try {
      const book = await createBook({
        title: result.title,
        author: result.author,
        publisher: result.publisher,
        isbn: result.isbn,
        cover_url: result.cover_url || null,
        language: result.language || "ko",
        is_children: result.is_children ?? false,
      });
      toast.success(`"${result.title}" 책장에 추가!`);
      setSearchResults([]);
      setQuery("");
      setLastAddedBook(book);
      // 최근 추가 목록 갱신
      setRecentBooks((prev) => [book, ...prev.filter((b) => b.id !== book.id)].slice(0, 4));
    } catch {
      toast.error("추가에 실패했어요");
    }
  };

  const handleBarcodeScan = async (isbn: string) => {
    setScannerOpen(false);
    try {
      const result = await searchBookByIsbn(isbn);
      if (result.source === "local") {
        toast("이미 책장에 있는 책이에요!", { icon: "📚" });
      } else {
        await handleAddBook(result.book);
      }
    } catch {
      toast.error("이 바코드의 책 정보를 찾지 못했어요");
    }
  };

  const handleManualAdd = async () => {
    if (!manualTitle.trim() || !manualAuthor.trim()) {
      toast.error("제목과 저자를 입력해주세요");
      return;
    }
    setAdding(true);
    try {
      const book = await createBook({
        title: manualTitle.trim(),
        author: manualAuthor.trim(),
        publisher: manualPublisher.trim() || "",
        isbn: null,
        cover_url: null,
        language: "ko",
        is_children: false,
      });
      toast.success(`"${book.title}" 책장에 추가!`);
      setManualTitle("");
      setManualAuthor("");
      setManualPublisher("");
      setShowManual(false);
      setLastAddedBook(book);
      setRecentBooks((prev) => [book, ...prev.filter((b) => b.id !== book.id)].slice(0, 4));
    } catch {
      toast.error("추가에 실패했어요");
    } finally {
      setAdding(false);
    }
  };

  return {
    navigate,
    searchInputRef,

    // 검색 상태
    query,
    setQuery,
    searchResults,
    searching,
    handleSearch,

    // 바코드 스캔
    scannerOpen,
    setScannerOpen,
    handleBarcodeScan,

    // 검색 결과 액션
    selectedBook,
    setSelectedBook,
    handleAddBook,

    // 추가 완료 CTA
    lastAddedBook,
    setLastAddedBook,

    // 직접 입력
    showManual,
    setShowManual,
    manualTitle,
    setManualTitle,
    manualAuthor,
    setManualAuthor,
    manualPublisher,
    setManualPublisher,
    adding,
    handleManualAdd,

    // 최근 추가한 책
    recentBooks,
  };
}
