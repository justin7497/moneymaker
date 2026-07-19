import { useState, type FormEvent } from "react";
import {
  formatWon,
  type NaverShoppingProduct,
} from "../../shared/naverShopping";
import { searchShoppingProducts } from "../lib/shoppingApi";

type Props = {
  onSelect: (product: NaverShoppingProduct) => void;
};

export function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NaverShoppingProduct[]>([]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchShoppingProducts(q);
      setItems(results);
      if (results.length === 0) {
        setError("검색 결과가 없습니다. 다른 키워드로 시도해 보세요.");
      }
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "쇼핑 검색에 실패했습니다. API 설정을 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel search-panel">
      <h2>보조 · 네이버 쇼핑 검색</h2>
      <p className="muted">
        브랜드커넥트 URL이 없을 때만 사용하세요. 일반 쇼핑 검색 결과라 수수료
        링크는 포함되지 않습니다.
      </p>

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 차량용 무선 충전기"
          aria-label="쇼핑 검색어"
        />
        <button type="submit" className="primary" disabled={loading || !query.trim()}>
          {loading ? "검색 중…" : "상품 조회"}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}

      {items.length > 0 && (
        <ul className="search-results">
          {items.map((item) => {
            const price = formatWon(item.lprice);
            return (
              <li key={`${item.productId ?? item.link}-${item.title}`}>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => onSelect(item)}
                >
                  {item.image ? (
                    <img src={item.image} alt="" width={56} height={56} />
                  ) : (
                    <span className="search-result-placeholder" />
                  )}
                  <span className="search-result-body">
                    <strong>{item.title}</strong>
                    <span className="search-result-meta">
                      {price && <em>{price}</em>}
                      {item.mallName && <span>{item.mallName}</span>}
                      {item.brand && <span>{item.brand}</span>}
                    </span>
                  </span>
                  <span className="search-result-action">선택</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
