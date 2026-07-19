import { useState } from "react";
import { toNaverBlogFormat } from "../adapters/naverBlog";
import { BlogPreview } from "../components/BlogPreview";
import { CopyButtons } from "../components/CopyButtons";
import {
  emptyFormValues,
  ProductForm,
  type ProductFormValues,
} from "../components/ProductForm";
import type { NaverBlogPost, ProductDraft } from "../types/product";

export function NaverBrandConnectPage() {
  const [formValues, setFormValues] =
    useState<ProductFormValues>(emptyFormValues);
  const [post, setPost] = useState<NaverBlogPost | null>(null);

  function handleGenerate(draft: ProductDraft) {
    setPost(toNaverBlogFormat(draft));
  }

  return (
    <div className="app">
      <header className="header">
        <h1>네이버 브랜드커넥트</h1>
        <p>상품 정보 → 네이버 블로그 초안</p>
      </header>

      <main className="layout">
        <ProductForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={handleGenerate}
        />
        <div className="result-column">
          <CopyButtons post={post} />
          <BlogPreview post={post} />
        </div>
      </main>
    </div>
  );
}
