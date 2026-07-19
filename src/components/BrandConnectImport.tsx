import { useState, type FormEvent } from "react";
import {
  formatBrandConnectPrice,
  parseBrandConnectUrl,
  type BrandConnectProduct,
} from "../../shared/brandConnect";
import {
  lookupBrandConnectProduct,
  searchBrandConnectByUrl,
} from "../lib/brandConnectApi";

type Props = {
  onLoaded: (product: BrandConnectProduct) => void;
};

const DEFAULT_LIST_URL =
  "https://brandconnect.naver.com/848121438767872/affiliate/products";

export function BrandConnectImport({ onLoaded }: Props) {
  const [url, setUrl] = useState(DEFAULT_LIST_URL);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BrandConnectProduct[]>([]);
  const [loaded, setLoaded] = useState<BrandConnectProduct | null>(null);

  const parsed = parseBrandConnectUrl(url);
  const isList = parsed?.kind === "list";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const raw = url.trim();
    if (!raw) return;

    setLoading(true);
    setError(null);
    setLoaded(null);

    try {
      const kind = parseBrandConnectUrl(raw)?.kind;
      if (kind === "product") {
        const product = await lookupBrandConnectProduct(raw);
        setItems([]);
        setLoaded(product);
        onLoaded(product);
        return;
      }

      if (kind === "list") {
        const results = await searchBrandConnectByUrl({
          listUrl: raw,
          query,
        });
        setItems(results);
        if (results.length === 0) {
          setError("검색 결과가 없습니다. 다른 검색어로 시도해 보세요.");
        }
        return;
      }

      throw new Error(
        "브랜드커넥트 URL 형식이 아닙니다. 상품 목록 또는 상품 상세 URL을 넣어 주세요.",
      );
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "브랜드커넥트 상품 정보를 가져오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(item: BrandConnectProduct) {
    setLoading(true);
    setError(null);
    try {
      // 상세 조회로 shortenUrl(제휴 링크)까지 확보
      const detail = await lookupBrandConnectProduct(item.sourceUrl);
      setLoaded(detail);
      onLoaded(detail);
    } catch {
      // 상세 실패 시 목록 데이터라도 반영
      setLoaded(item);
      onLoaded(item);
    } finally {
      setLoading(false);
    }
  }

  const loadedPrice =
    formatBrandConnectPrice(loaded?.discountedSalePrice) ||
    formatBrandConnectPrice(loaded?.salePrice);

  return (
    <section className="panel search-panel">
      <h2>1. 브랜드커넥트 상품 URL</h2>
      <p className="muted">
        상품 목록 URL을 넣고 검색어로 상품을 고르거나, 상품 상세 URL을 바로
        붙여넣으세요. 수수료·이미지·제휴 링크를 블로그 초안용으로 채웁니다.
      </p>

      <form className="bc-form" onSubmit={handleSubmit}>
        <label>
          브랜드커넥트 URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={DEFAULT_LIST_URL}
            aria-label="브랜드커넥트 URL"
          />
        </label>

        {isList && (
          <label>
            상품 검색어
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 차량용 무선 충전기"
              aria-label="상품 검색어"
            />
          </label>
        )}

        <button
          type="submit"
          className="primary"
          disabled={
            loading || !url.trim() || (isList && !query.trim())
          }
        >
          {loading ? "수집 중…" : isList ? "상품 목록 검색" : "상품 데이터 수집"}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}

      {items.length > 0 && (
        <ul className="search-results">
          {items.map((item) => {
            const price =
              formatBrandConnectPrice(item.discountedSalePrice) ||
              formatBrandConnectPrice(item.salePrice);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => handleSelect(item)}
                  disabled={loading}
                >
                  {item.representativeProductImageUrl ? (
                    <img
                      src={item.representativeProductImageUrl}
                      alt=""
                      width={56}
                      height={56}
                    />
                  ) : (
                    <span className="search-result-placeholder" />
                  )}
                  <span className="search-result-body">
                    <strong>{item.productName}</strong>
                    <span className="search-result-meta">
                      {price && <em>{price}</em>}
                      {typeof item.commissionRate === "number" && (
                        <span>수수료 {item.commissionRate}%</span>
                      )}
                      {item.storeName && <span>{item.storeName}</span>}
                    </span>
                  </span>
                  <span className="search-result-action">선택</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
              {loadedPrice && <em>{loadedPrice}</em>}
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
