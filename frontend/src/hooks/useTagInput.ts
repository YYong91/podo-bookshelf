import { useState } from "react";

/** 해시태그 입력 관리 훅 — WriteReviewPage, ReviewDetailPage에서 공유 */
export function useTagInput(initialTags: string[] = []) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.replace(/^#+/, "").trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  /** 미입력 상태의 tagInput까지 flush하여 최종 태그 배열 반환 */
  const flushTags = (): string[] => {
    if (tagInput.trim()) {
      return [...tags, tagInput.replace(/^#+/, "").trim().toLowerCase()].filter(
        (t, i, a) => t && a.indexOf(t) === i,
      );
    }
    return tags;
  };

  return {
    tags,
    setTags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagKeyDown,
    flushTags,
  };
}
