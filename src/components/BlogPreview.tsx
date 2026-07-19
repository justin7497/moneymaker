import type { NaverBlogPost } from "../types/product";

type Props = {
  post: NaverBlogPost | null;
};

export function BlogPreview({ post }: Props) {
  if (!post) {
    return (
      <section className="panel preview empty">
        <h2>미리보기</h2>
        <p className="muted">상품 정보를 입력하고 초안을 생성하세요.</p>
      </section>
    );
  }

  return (
    <section className="panel preview">
      <h2>미리보기</h2>
      <h3 className="preview-title">{post.title}</h3>
      <div
        className="preview-body"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      {post.tags.length > 0 && (
        <p className="preview-tags">{post.tags.map((t) => `#${t}`).join(" ")}</p>
      )}
    </section>
  );
}
