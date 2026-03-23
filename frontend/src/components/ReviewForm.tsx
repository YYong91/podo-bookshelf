import { X } from "lucide-react";

interface TagInputFieldProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagBlur: () => void;
  onRemoveTag: (tag: string) => void;
  /** 태그 chip 내부 X 아이콘 크기 (기본 12) */
  iconSize?: number;
  /** input placeholder (태그 없을 때만 표시) */
  placeholder?: string;
  /** input text 크기 class (기본 "text-sm") */
  textSize?: string;
  /** 컨테이너 min-height class (기본 "min-h-[46px]") */
  minHeight?: string;
}

/** 해시태그 입력 필드 — WriteReviewPage, ReviewDetailPage에서 공유 */
export default function TagInputField({
  tags,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onTagBlur,
  onRemoveTag,
  iconSize = 12,
  placeholder = "#태그 입력...",
  textSize = "text-sm",
  minHeight = "min-h-[46px]",
}: TagInputFieldProps) {
  return (
    <div className={`flex ${minHeight} flex-wrap items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-2 focus-within:border-grape-400`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-grape-100 px-2.5 py-0.5 text-xs font-medium text-grape-700"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="text-grape-400 hover:text-grape-700"
            aria-label={`태그 ${tag} 제거`}
          >
            <X size={iconSize} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={tagInput}
        onChange={(e) => onTagInputChange(e.target.value)}
        onKeyDown={onTagKeyDown}
        onBlur={onTagBlur}
        placeholder={tags.length === 0 ? placeholder : ""}
        className={`min-w-[80px] flex-1 bg-transparent ${textSize} outline-none placeholder:text-warm-300`}
      />
    </div>
  );
}
