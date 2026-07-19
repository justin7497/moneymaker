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
      <h2>1. 네이버 쇼핑 검색</h2>
      <p className="muted">
        상품명을 입력하면 이미지·최저가·상품 링크를 가져와 아래 폼에 자동
        입력합니다. (쇼핑커넥트 수수료 링크는 검색 후 제휴 URL에 직접 넣을 수
        있어요)
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
