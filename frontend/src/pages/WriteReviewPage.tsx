import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { searchBooks } from "../api/search";
import { createReviewWithBook } from "../api/reviews";
import type { BookSearchResult } from "../types";

export default function WriteReviewPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("ko");
  const [bookSelected, setBookSelected] = useState(false);

  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [childReaction, setChildReaction] = useState("");
  const [activity, setActivity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchBooks(query, language);
      setSearchResults(results);
    } catch {
      toast.error("검색에 실패했어요");
    } finally {
      setSearching(false);
    }
  };

  const selectBook = (book: BookSearchResult) => {
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.cover_url);
    setIsbn(book.isbn || "");
    setPublisher(book.publisher);
    setBookSelected(true);
    setSearchResults([]);
  };

  const resetBook = () => {
    setTitle("");
    setAuthor("");
    setCoverUrl("");
    setIsbn("");
    setPublisher("");
    setBookSelected(false);
    setManualMode(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) {
      toast.error("책 제목과 저자를 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await createReviewWithBook({
        title, author, cover_url: coverUrl || null,
        isbn: isbn || null, publisher: publisher || null,
        language, read_date: readDate, memo,
        child_reaction: childReaction, activity,
      });
      toast.success("포도알이 하나 생겼어요!");
      navigate("/");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-grape-700">리뷰 쓰기</h1>

      {!bookSelected ? (
        <div className="space-y-4">
          {/* 언어 선택 */}
          <div className="flex gap-2">
            {[
              { value: "ko", label: "한글책" },
              { value: "en", label: "영어책" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setLanguage(opt.value); setSearchResults([]); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  language === opt.value
                    ? "bg-grape-600 text-white"
                    : "bg-warm-100 text-warm-600 hover:bg-warm-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {!manualMode ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="책 제목으로 검색..."
                  className="flex-1 rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="rounded-lg bg-grape-600 px-4 text-white hover:bg-grape-700 disabled:opacity-50"
                >
                  <Search size={18} />
                </button>
              </div>
              <button
                onClick={() => setManualMode(true)}
                className="text-sm text-grape-500 underline"
              >
                직접 입력하기
              </button>
              {searching && <p className="text-center text-sm text-warm-400">검색 중...</p>}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((book, i) => (
                    <button
                      key={i}
                      onClick={() => selectBook(book)}
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
              <div className="flex gap-2">
                <button onClick={() => setManualMode(false)} className="text-sm text-warm-500 underline">검색으로 돌아가기</button>
                <button
                  onClick={() => { if (title && author) setBookSelected(true); }}
                  className="rounded-lg bg-grape-600 px-4 py-2 text-sm text-white hover:bg-grape-700"
                >
                  이 책으로 선택
                </button>
              </div>
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
              {language === "ko" ? "한글" : "영어"}
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
              onChange={(e) => setReadDate(e.target.value)}
              className="w-full rounded-lg border border-warm-200 px-4 py-3 text-sm focus:border-grape-400 focus:outline-none"
            />
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
            <textarea
              value={activity} onChange={(e) => setActivity(e.target.value)}
              rows={3} placeholder="책으로 어떤 활동을 했나요? (독후활동, 놀이, 만들기 등)"
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
