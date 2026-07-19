import { useState } from "react";
import { copyHtml, copyText } from "../lib/clipboard";
import type { NaverBlogPost } from "../types/product";

type Props = {
  post: NaverBlogPost | null;
};

type CopyKind = "title" | "body" | "tags" | null;

export function CopyButtons({ post }: Props) {
  const [copied, setCopied] = useState<CopyKind>(null);

  async function handleCopy(kind: Exclude<CopyKind, null>, action: () => Promise<void>) {
    if (!post) return;
    try {
      await action();
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch (error) {
      console.error(error);
      alert("복사에 실패했습니다. 브라우저 클립보드 권한을 확인해 주세요.");
    }
  }

  const disabled = !post;

  return (
    <section className="panel copy-actions">
      <h2>복사</h2>
      <p className="muted">네이버 스마트에디터에 붙여넣기하세요.</p>
      <div className="button-row">
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            handleCopy("title", () => copyText(post!.title))
          }
        >
          {copied === "title" ? "제목 복사됨" : "제목 복사"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            handleCopy("body", () => copyHtml(post!.html, post!.plainText))
          }
        >
          {copied === "body" ? "본문 복사됨" : "본문 HTML 복사"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            handleCopy("tags", () => copyText(post!.tags.join(", ")))
          }
        >
          {copied === "tags" ? "태그 복사됨" : "태그 복사"}
        </button>
      </div>
    </section>
  );
}
