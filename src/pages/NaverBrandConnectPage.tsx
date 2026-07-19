import { useState } from "react";
import { toNaverBlogFormat } from "../adapters/naverBlog";
import { BlogPreview } from "../components/BlogPreview";
import { CopyButtons } from "../components/CopyButtons";
import {
  emptyFormValues,
  ProductForm,
  type ProductFormValues,
} from "../components/ProductForm";
import { ProductSearch } from "../components/ProductSearch";
import { formatWon, type NaverShoppingProduct } from "../../shared/naverShopping";
import type { NaverBlogPost, ProductDraft } from "../types/product";

function benefitsFromProduct(product: NaverShoppingProduct): string {
  const lines = [
    product.brand ? `브랜드: ${product.brand}` : "",
    product.mallName ? `판매처: ${product.mallName}` : "",
    [product.category1, product.category2, product.category3, product.category4]
      .filter(Boolean)
      .join(" > "),
  ].filter(Boolean);
  return lines.join("\n");
}

export function NaverBrandConnectPage() {
  const [formValues, setFormValues] =
    useState<ProductFormValues>(emptyFormValues);
  const [post, setPost] = useState<NaverBlogPost | null>(null);
  const [source, setSource] = useState<ProductDraft["source"]>("manual");

  function handleSelectProduct(product: NaverShoppingProduct) {
    const price = formatWon(product.lprice);
    setSource("naver_shopping");
    setFormValues((prev) => ({
      ...prev,
      name: product.title,
      price: price || prev.price,
      affiliateUrl: product.link || prev.affiliateUrl,
      imageUrlsText: product.image
        ? product.image
        : prev.imageUrlsText,
      benefitsText: prev.benefitsText.trim()
        ? prev.benefitsText
        : benefitsFromProduct(product),
    }));
    setPost(null);
  }

  function handleGenerate(draft: ProductDraft) {
    setPost(toNaverBlogFormat({ ...draft, source }));
  }

  return (
    <div className="app">
      <header className="header">
        <h1>네이버 브랜드커넥트</h1>
        <p>쇼핑 검색으로 상품 정보를 채운 뒤 → 네이버 블로그 초안</p>
      </header>

      <ProductSearch onSelect={handleSelectProduct} />

      <main className="layout">
        <ProductForm
          values={formValues}
          onChange={(values) => {
            setSource("manual");
            setFormValues(values);
          }}
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
