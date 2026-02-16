import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { searchBooks, searchBookByIsbn } from "../api/search";
import { getBooks } from "../api/books";
import { createReview, createReviewWithBook } from "../api/reviews";
import api from "../api/client";
import MilestoneModal from "../components/MilestoneModal";
import BarcodeScanner from "../components/BarcodeScanner";
import type { Book, BookSearchResult } from "../types";

const MILESTONE_NUMBERS = new Set([10, 20, 30, 50, 100, 200, 300, 500]);

type SearchMode = "new" | "my" | "manual";
type AgeFormat = "months" | "years_months";

export default function WriteReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preBookId = searchParams.get("book_id");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchMode, setSearchMode] = useState<SearchMode>("new");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);

  // 선택된 책 정보
  const [selectedBookId, setSelectedBookId] = useState<string | null>(preBookId);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("ko");
  const [bookSelected, setBookSelected] = useState(!!preBookId);

  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [activity, setActivity] = useState("");
  const [childAgeYears, setChildAgeYears] = useState("");
  const [childAgeMonths, setChildAgeMonths] = useState("");
  const [ageFormat, setAgeFormat] = useState<AgeFormat>("months");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [milestoneTotal, setMilestoneTotal] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = async (isbn: string) => {
    setScannerOpen(false);
    try {
      const result = await searchBookByIsbn(isbn);
      if (result.source === "local") {
        selectMyBook(result.book as Book);
      } else {
        selectNewBook(result.book as BookSearchResult);
      }
      toast.success("책을 찾았어요!");
    } catch {
      toast.error("이 바코드의 책 정보를 찾지 못했어요");
    }
  };

  const totalAgeMonths = (parseInt(childAgeYears || "0") * 12) + parseInt(childAgeMonths || "0");

  const handleTotalMonthsChange = (value: string) => {
    const total = parseInt(value) || 0;
    setChildAgeYears(String(Math.floor(total / 12)));
    setChildAgeMonths(String(total % 12));
  };

  // 아이 생년월일 로드 & 자동 나이 계산
  useEffect(() => {
    api.get<{ child_birthdate?: string }>("/settings").then((r) => {
      if (r.data.child_birthdate) {
        setChildBirthdate(r.data.child_birthdate);
      }
    });
  }, []);

  useEffect(() => {
    if (!childBirthdate || !readDate) return;
    const birth = new Date(childBirthdate);
    const read = new Date(readDate);
    let years = read.getFullYear() - birth.getFullYear();
    let months = read.getMonth() - birth.getMonth();
    if (read.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years >= 0 && months >= 0) {
      setChildAgeYears(String(years));
      setChildAgeMonths(String(months));
    }
  }, [childBirthdate, readDate]);

  // preBookId가 있으면 책 정보 로드
  useState(() => {
    if (preBookId) {
      import("../api/books").then(({ getBook }) =>
        getBook(preBookId).then((b) => {
          setTitle(b.title);
          setAuthor(b.author);
          setCoverUrl(b.cover_url || "");
          setPublisher(b.publisher || "");
          setLanguage(b.language || "ko");
          setBookSelected(true);
        })
      );
    }
  });

  // 검색 입력란 자동 포커스
  useEffect(() => {
    if (!bookSelected) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [bookSelected, searchMode]);

  const handleSearchMyBooks = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { items } = await getBooks(query);
      setMyBooks(items);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchNewBooks = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchBooks(query);
      setSearchResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "my") handleSearchMyBooks();
    else handleSearchNewBooks();
  };

  const selectMyBook = (book: Book) => {
    setSelectedBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.cover_url || "");
    setPublisher(book.publisher || "");
    setLanguage(book.language || "ko");
    setBookSelected(true);
    setMyBooks([]);
  };

  const selectNewBook = (book: BookSearchResult) => {
    setSelectedBookId(null);
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.cover_url);
    setIsbn(book.isbn || "");
    setPublisher(book.publisher);
    setLanguage(book.language || "ko");
    setBookSelected(true);
    setSearchResults([]);
  };

  const resetBook = () => {
    setSelectedBookId(null);
    setTitle("");
    setAuthor("");
    setCoverUrl("");
    setIsbn("");
    setPublisher("");
    setBookSelected(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const ageMonths = childAgeYears || childAgeMonths
      ? (parseInt(childAgeYears || "0") * 12) + parseInt(childAgeMonths || "0")
      : null;
    try {
      let result;
      if (selectedBookId) {
        // 기존 책에 리딩로그 추가
        result = await createReview({
          book_id: selectedBookId, read_date: readDate,
          memo, child_reaction: childReaction, activity,
          child_age_months: ageMonths,
        });
      } else {
        // 새 책 + 리딩로그
        if (!title.trim() || !author.trim()) {
          toast.error("책 제목과 저자를 입력해주세요");
          setSubmitting(false);
          return;
        }
        result = await createReviewWithBook({
          title, author, cover_url: coverUrl || null,
          isbn: isbn || null, publisher: publisher || null,
          language, read_date: readDate, memo,
          child_reaction: childReaction, activity,
          child_age_months: ageMonths,
        });
      }
      const total = result.total_reviews;
      if (total && MILESTONE_NUMBERS.has(total)) {
        setMilestoneTotal(total);
      } else {
        toast.success("포도알이 하나 생겼어요!");
        navigate("/");
      }
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setScannerOpen(false)}
      />
      {milestoneTotal && (
        <MilestoneModal total={milestoneTotal} onClose={() => navigate("/")} />
      )}
      <h1 className="text-xl font-bold text-grape-700">리뷰 쓰기</h1>

      {!bookSelected ? (
        <div className="space-y-4">
          {/* 검색 모드 탭 */}
          <div className="flex gap-2">
            {[
              { value: "new" as const, label: "새 책 검색" },
              { value: "my" as const, label: "내 책에서 찾기" },
              { value: "manual" as const, label: "직접 입력" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSearchMode(opt.value); setSearchResults([]); setMyBooks([]); setQuery(""); }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  searchMode === opt.value
                    ? "bg-grape-600 text-white"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {searchMode !== "manual" ? (
            <>
              <div className="flex gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={searchMode === "my" ? "읽었던 책 제목/저자 검색..." : "책 제목으로 검색..."}
                  className="flex-1 rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="rounded-lg bg-grape-600 px-4 text-white hover:bg-grape-700 disabled:opacity-50"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="rounded-lg bg-warm-100 px-3 text-warm-600 hover:bg-warm-200"
                  title="바코드 스캔"
                >
                  <Camera size={18} />
                </button>
              </div>
              {searching && <p className="text-center text-sm text-warm-400">검색 중...</p>}

              {/* 내 책 검색 결과 */}
              {searchMode === "my" && myBooks.length > 0 && (
                <div className="space-y-2">
                  {myBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => selectMyBook(book)}
                      className="flex w-full gap-3 rounded-lg border border-grape-200 bg-grape-50/50 p-3 text-left hover:border-grape-400 hover:bg-grape-50"
                    >
                      {book.cover_url ? (
                        <img src={book.cover_url} alt="" className="h-16 w-12 rounded object-cover" />
                      ) : (
                        <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100">📕</div>
                      )}
                      <div>
                        <p className="font-semibold text-warm-900">{book.title}</p>
                        <p className="text-xs text-warm-500">{book.author}</p>
                        <p className="text-xs text-grape-500">{book.review_count}회 읽음</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchMode === "my" && !searching && myBooks.length === 0 && query && (
                <p className="text-center text-sm text-warm-400">
                  등록된 책에서 찾지 못했어요.{" "}
                  <button onClick={() => setSearchMode("new")} className="text-grape-500 underline">새 책 검색</button>
                  으로 해보세요.
                </p>
              )}

              {/* 새 책 검색 결과 */}
              {searchMode === "new" && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((book, i) => (
                    <button
                      key={i}
                      onClick={() => selectNewBook(book)}
                      className="flex w-full gap-3 rounded-lg border border-warm-200 p-3 text-left hover:border-grape-300 hover:bg-grape-50"
                    >
                      {book.cover_url ? (
                        <img src={book.cover_url} alt="" className="h-16 w-12 rounded object-cover" />
                      ) : (
                        <div className="flex h-16 w-12 items-center justify-center rounded bg-grape-100">📕</div>
                      )}
                      <div>
                        <p className="font-semibold text-warm-900">{book.title}</p>
                        <p className="text-xs text-warm-500">{book.author}</p>
                        {book.publisher && <p className="text-xs text-warm-500">{book.publisher}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input
                ref={searchInputRef}
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="책 제목 *" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="저자 *" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <input
                value={publisher} onChange={(e) => setPublisher(e.target.value)}
                placeholder="출판사 (선택)" className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
              />
              <button
                onClick={() => { if (title && author) setBookSelected(true); }}
                className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700"
              >
                이 책으로 선택
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl bg-grape-50 p-4">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-20 w-14 rounded object-cover" />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded bg-grape-100 text-2xl">📕</div>
          )}
          <div className="flex-1">
            <p className="font-bold text-warm-900">{title}</p>
            <p className="text-sm text-warm-500">{author}</p>
            {publisher && <p className="text-xs text-warm-500">{publisher}</p>}
            <span className="mt-1 inline-block rounded-full bg-grape-100 px-2 py-0.5 text-xs text-grape-600">
              {selectedBookId ? "등록된 책" : language === "ko" ? "한글" : "영어"}
            </span>
          </div>
          <button onClick={resetBook} className="text-warm-400 hover:text-warm-600">
            <X size={18} />
          </button>
        </div>
      )}

      {bookSelected && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">읽은 날짜</label>
            <input
              type="date" value={readDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setReadDate(e.target.value)}
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-warm-700">읽을 때 아이 나이 (선택)</label>
              <button
                type="button"
                onClick={() => setAgeFormat(ageFormat === "months" ? "years_months" : "months")}
                className="rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500 hover:bg-warm-200"
              >
                {ageFormat === "months" ? "세/개월로 보기" : "개월로 보기"}
              </button>
            </div>
            {ageFormat === "months" ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" value={totalAgeMonths || ""} onChange={(e) => handleTotalMonthsChange(e.target.value)}
                  min="0" max="144" placeholder="0"
                  className="w-24 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
                />
                <span className="text-sm text-warm-500">개월</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number" value={childAgeYears} onChange={(e) => setChildAgeYears(e.target.value)}
                  min="0" max="12" placeholder="0"
                  className="w-20 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
                />
                <span className="text-sm text-warm-500">세</span>
                <input
                  type="number" value={childAgeMonths} onChange={(e) => setChildAgeMonths(e.target.value)}
                  min="0" max="11" placeholder="0"
                  className="w-20 rounded-lg border border-warm-200 px-3 py-3 text-center text-sm focus:border-grape-400 focus:outline-none"
                />
                <span className="text-sm text-warm-500">개월</span>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">감상/메모</label>
            <textarea
              value={memo} onChange={(e) => setMemo(e.target.value)}
              rows={3} placeholder="이 책을 읽고 느낀 점을 자유롭게 적어보세요..."
              className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">아이 반응</label>
            <textarea
              value={childReaction} onChange={(e) => setChildReaction(e.target.value)}
              rows={2} placeholder="아이가 어떤 반응을 보였나요?"
              className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-warm-700">활용 내용</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["그림 그리기", "역할놀이", "만들기/공작", "노래/율동", "요리/간식", "야외 체험", "퀴즈/대화", "따라 읽기"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActivity((prev) => prev ? `${prev}, ${tag}` : tag)}
                  className="rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-1 text-xs text-leaf-700 transition-colors hover:bg-leaf-100"
                >
                  + {tag}
                </button>
              ))}
            </div>
            <textarea
              value={activity} onChange={(e) => setActivity(e.target.value)}
              rows={3} placeholder="책으로 어떤 활동을 했나요?"
              className="w-full resize-none rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-grape-600 py-4 text-base font-bold text-white transition-colors hover:bg-grape-700 disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "포도알 심기!"}
          </button>
        </div>
      )}
    </div>
  );
}
