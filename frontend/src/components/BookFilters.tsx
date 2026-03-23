import { Search, X } from "lucide-react";
import { type RefObject } from "react";

const SORT_OPTIONS = [
  { value: "recent", label: "최근 읽은 순" },
  { value: "newest", label: "등록순" },
  { value: "title", label: "제목순" },
  { value: "most_read", label: "많이 읽은 순" },
] as const;

interface BookFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

/** 책장 페이지의 검색 + 정렬 필터 바 */
export default function BookFilters({
  query,
  onQueryChange,
  sort,
  onSortChange,
  searchRef,
}: BookFiltersProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="제목이나 저자로 찾기..."
          className="w-full rounded-lg border border-warm-200 py-2.5 pl-9 pr-8 text-sm focus:border-grape-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-lg border border-warm-200 px-3 py-2.5 text-sm text-warm-700 focus:border-grape-400 focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
