import { useState, type FormEvent } from "react";
import {
  formatBrandConnectPrice,
  type BrandConnectProduct,
} from "../../shared/brandConnect";
import { lookupBrandConnectProduct } from "../lib/brandConnectApi";

type Props = {
  onLoaded: (product: BrandConnectProduct) => void;
};

export function BrandConnectImport({ onLoaded }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<BrandConnectProduct | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const raw = url.trim();
    if (!raw) return;

    setLoading(true);
    setError(null);
    try {
      const product = await lookupBrandConnectProduct(raw);
      setLoaded(product);
      onLoaded(product);
    } catch (err) {
      setLoaded(null);
      setError(
        err instanceof Error
          ? err.message
          : "브랜드커넥트 상품 정보를 가져오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  const price =
    formatBrandConnectPrice(loaded?.discountedSalePrice) ||
    formatBrandConnectPrice(loaded?.salePrice);

  return (
    <section className="panel search-panel">
      <h2>1. 브랜드커넥트 상품 URL</h2>
      <p className="muted">
        쇼핑커넥트 상품 상세 URL을 붙여넣으면 상품명·가격·이미지·수수료·제휴
        링크를 가져와 블로그 초안용 데이터로 채웁니다.
      </p>

      <form className="search-row" onSubmit={handleSubmit}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://brandconnect.naver.com/.../affiliate/products/..."
          aria-label="브랜드커넥트 상품 URL"
        />
        <button
          type="submit"
          className="primary"
          disabled={loading || !url.trim()}
        >
          {loading ? "수집 중…" : "상품 데이터 수집"}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}

      {loaded && (
        <div className="bc-loaded">
          {loaded.representativeProductImageUrl && (
            <img
              src={loaded.representativeProductImageUrl}
              alt=""
              width={72}
              height={72}
            />
          )}
          <div>
            <strong>{loaded.productName}</strong>
            <p className="search-result-meta">
              {price && <em>{price}</em>}
              {typeof loaded.commissionRate === "number" && (
                <span>수수료 {loaded.commissionRate}%</span>
              )}
              {loaded.storeName && <span>{loaded.storeName}</span>}
            </p>
            <p className="field-hint">
              아래 폼에 반영됐습니다. 필요하면 수정한 뒤 초안을 생성하세요.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
