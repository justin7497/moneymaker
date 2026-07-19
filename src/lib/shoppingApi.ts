import type {
  NaverShoppingProduct,
  ShoppingSearchError,
  ShoppingSearchResponse,
} from "../../shared/naverShopping";

export type { NaverShoppingProduct };

function apiBase(): string {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (base) return base.replace(/\/$/, "");
  // Local Vite middleware is mounted at /api (not under /moneymaker)
  return "";
}

export async function searchShoppingProducts(
  query: string,
): Promise<NaverShoppingProduct[]> {
  const q = query.trim();
  if (!q) return [];

  if (!import.meta.env.DEV && !apiBase()) {
    throw new Error(
      "프로덕션 쇼핑 API가 아직 연결되지 않았습니다. 로컬에서는 npm run dev로 사용하거나, Cloudflare Worker 배포 후 VITE_API_BASE를 설정해 주세요.",
    );
  }

  const root = apiBase();
  const url = `${root}/api/shopping/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const data = (await res.json()) as ShoppingSearchResponse | ShoppingSearchError;

  if (!res.ok || !data.ok) {
    const message =
      !data.ok && "message" in data && data.message
        ? data.message
        : !data.ok
          ? data.error
          : `http_${res.status}`;
    throw new Error(message);
  }

  return data.items;
}
