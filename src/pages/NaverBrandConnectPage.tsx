import { useState } from "react";
import {
  formatBrandConnectPrice,
  type BrandConnectProduct,
} from "../../shared/brandConnect";
import { formatWon, type NaverShoppingProduct } from "../../shared/naverShopping";
import { toNaverBlogFormat } from "../adapters/naverBlog";
import { BlogPreview } from "../components/BlogPreview";
import { BrandConnectImport } from "../components/BrandConnectImport";
import { CopyButtons } from "../components/CopyButtons";
import {
  emptyFormValues,
  ProductForm,
  type ProductFormValues,
} from "../components/ProductForm";
import { ProductSearch } from "../components/ProductSearch";
import type { NaverBlogPost, ProductDraft } from "../types/product";

function benefitsFromBrandConnect(product: BrandConnectProduct): string {
  const lines = [
    product.storeName ? `스토어: ${product.storeName}` : "",
    typeof product.commissionRate === "number"
      ? `쇼핑커넥트 수수료: ${product.commissionRate}%`
      : "",
    typeof product.promotionCommissionRate === "number" &&
    product.promotionCommissionRate > 0
      ? `추가 수수료: ${product.promotionCommissionRate}%`
      : "",
    product.brandStore ? "브랜드스토어 상품" : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function benefitsFromShopping(product: NaverShoppingProduct): string {
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
  const [showShoppingSearch, setShowShoppingSearch] = useState(false);

  function handleBrandConnectLoaded(product: BrandConnectProduct) {
    const price =
      formatBrandConnectPrice(product.discountedSalePrice) ||
      formatBrandConnectPrice(product.salePrice);
    const images = [
      product.representativeProductImageUrl,
      ...(product.otherProductImageUrls ?? []),
    ]
      .filter((x): x is string => Boolean(x))
      .join("\n");

    setSource("brand_connect");
    setFormValues((prev) => ({
      ...prev,
      name: product.productName,
      price: price || prev.price,
      affiliateUrl:
        product.shortenUrl || product.sourceUrl || product.productUrl || prev.affiliateUrl,
      imageUrlsText: images || prev.imageUrlsText,
      benefitsText: benefitsFromBrandConnect(product),
      reviewNote: prev.reviewNote,
    }));
    setPost(null);
  }

  function handleSelectShoppingProduct(product: NaverShoppingProduct) {
    const price = formatWon(product.lprice);
    setSource("naver_shopping");
    setFormValues((prev) => ({
      ...prev,
      name: product.title,
      price: price || prev.price,
      affiliateUrl: product.link || prev.affiliateUrl,
      imageUrlsText: product.image ? product.image : prev.imageUrlsText,
      benefitsText: prev.benefitsText.trim()
        ? prev.benefitsText
        : benefitsFromShopping(product),
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
        <p>브랜드커넥트 상품 URL → 데이터 수집 → 네이버 블로그 초안</p>
      </header>

      <BrandConnectImport onLoaded={handleBrandConnectLoaded} />

      <div className="secondary-tools">
        <button
          type="button"
          className="linkish"
          onClick={() => setShowShoppingSearch((v) => !v)}
        >
          {showShoppingSearch
            ? "네이버 쇼핑 검색 닫기"
            : "보조: 네이버 쇼핑 검색으로 채우기"}
        </button>
        {showShoppingSearch && (
          <ProductSearch onSelect={handleSelectShoppingProduct} />
        )}
      </div>

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
