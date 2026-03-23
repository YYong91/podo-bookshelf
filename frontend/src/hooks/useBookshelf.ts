import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getBooks, createBook } from "../api/books";
import { searchBooks, searchBookByIsbn } from "../api/search";
import type { Book, BookSearchResult } from "../types";

const PAGE_SIZE = 30;

/** 책장 페이지의 데이터 페칭 + 상태 관리 훅 */
export function useBookshelf() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // 검색 디바운스
  const [sort, setSort] = useState("recent");
  const [offset, setOffset] = useState(0);

  // 새 책 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<BookSearchResult[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const addSearchRef = useRef<HTMLInputElement>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const loadingRef = useRef(false);

  const fetchBooks = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return; // 중복 요청 방지
      loadingRef.current = true;
      setLoading(true);
      try {
        const newOffset = reset ? 0 : offset;
        const { items, total: t } = await getBooks({
          q: deferredQuery || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: newOffset,
        });
        if (reset) {
          setBooks(items);
          setOffset(items.length);
        } else {
          setBooks((prev) => [...prev, ...items]);
          setOffset(newOffset + items.length);
        }
        setTotal(t);
      } catch {
        toast.error("책 목록을 불러오지 못했어요");
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [deferredQuery, sort, offset],
  );

  // 초기 로드 + sort/query 변경 시 리셋
  useEffect(() => {
    setOffset(0);
    const load = async () => {
      setLoading(true);
      try {
        const { items, total: t } = await getBooks({
          q: deferredQuery || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: 0,
        });
        setBooks(items);
        setOffset(items.length);
        setTotal(t);
      } catch {
        toast.error("책 목록을 불러오지 못했어요");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sort, deferredQuery]);

  // 페이지 진입 시 검색바 포커스
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // 모달 열릴 때 검색바 포커스
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => addSearchRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  const handleAddSearch = async () => {
    if (!addQuery.trim()) return;
    setAddSearching(true);
    try {
      const results = await searchBooks(addQuery);
      setAddResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setAddSearching(false);
    }
  };

  const handleAddBook = async (result: BookSearchResult) => {
    try {
      await createBook({
        title: result.title,
        author: result.author,
        publisher: result.publisher,
        isbn: result.isbn,
        cover_url: result.cover_url || null,
        language: result.language || "ko",
        is_children: result.is_children,
      });
      toast.success(`"${result.title}" 책장에 추가!`);
      setShowAddModal(false);
      setAddQuery("");
      setAddResults([]);
      // 목록 새로고침
      const { items, total: t } = await getBooks({
        q: deferredQuery || undefined,
        sort,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setBooks(items);
      setOffset(items.length);
      setTotal(t);
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

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddQuery("");
    setAddResults([]);
  };

  const hasMore = offset < total;

  return {
    // 책 목록 상태
    books,
    total,
    loading,
    query,
    setQuery,
    sort,
    setSort,
    hasMore,
    fetchBooks,
    searchRef,

    // 새 책 추가 모달 상태
    showAddModal,
    setShowAddModal,
    addQuery,
    setAddQuery,
    addResults,
    addSearching,
    addSearchRef,
    scannerOpen,
    setScannerOpen,
    handleAddSearch,
    handleAddBook,
    handleBarcodeScan,
    closeAddModal,
  };
}
