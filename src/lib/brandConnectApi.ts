import type {
  BrandConnectLookupError,
  BrandConnectLookupResponse,
  BrandConnectProduct,
  BrandConnectSearchResponse,
} from "../../shared/brandConnect";
import { parseBrandConnectUrl } from "../../shared/brandConnect";

export type { BrandConnectProduct };

function apiBase(): string {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (base) return base.replace(/\/$/, "");
  return "";
}

function ensureApiConfigured() {
  if (!import.meta.env.DEV && !apiBase()) {
    throw new Error(
      "프로덕션 API가 아직 연결되지 않았습니다. 로컬에서는 npm run dev로 사용하거나 Worker + VITE_API_BASE를 설정해 주세요.",
    );
  }
}

function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const obj = data as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
  }
  return `http_${status}`;
}

export async function lookupBrandConnectProduct(
  brandConnectUrl: string,
): Promise<BrandConnectProduct> {
  const url = brandConnectUrl.trim();
  if (!url) throw new Error("브랜드커넥트 상품 URL을 입력해 주세요.");
  ensureApiConfigured();

  const root = apiBase();
  const endpoint = `${root}/api/brandconnect/product?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  const data = (await res.json()) as
    | BrandConnectLookupResponse
    | BrandConnectLookupError;

  if (!res.ok || !data.ok) {
    throw new Error(errorMessage(data, res.status));
  }
  return data.product;
}

export async function searchBrandConnectByUrl(options: {
  listUrl: string;
  query?: string;
}): Promise<BrandConnectProduct[]> {
  const listUrl = options.listUrl.trim();
  if (!listUrl) throw new Error("브랜드커넥트 URL을 입력해 주세요.");
  ensureApiConfigured();

  const parsed = parseBrandConnectUrl(listUrl);
  if (!parsed) {
    throw new Error(
      "브랜드커넥트 URL 형식이 아닙니다. 예: https://brandconnect.naver.com/{spaceId}/affiliate/products",
    );
  }

  const root = apiBase();
  const params = new URLSearchParams({ url: listUrl });
  if (options.query?.trim()) params.set("q", options.query.trim());

  const endpoint = `${root}/api/brandconnect/products?${params.toString()}`;
  const res = await fetch(endpoint);
  const data = (await res.json()) as
    | BrandConnectSearchResponse
    | BrandConnectLookupError;

  if (!res.ok || !data.ok) {
    throw new Error(errorMessage(data, res.status));
  }

  return data.items;
}
