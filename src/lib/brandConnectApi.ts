import type {
  BrandConnectLookupError,
  BrandConnectLookupResponse,
  BrandConnectProduct,
} from "../../shared/brandConnect";

export type { BrandConnectProduct };

function apiBase(): string {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (base) return base.replace(/\/$/, "");
  return "";
}

export async function lookupBrandConnectProduct(
  brandConnectUrl: string,
): Promise<BrandConnectProduct> {
  const url = brandConnectUrl.trim();
  if (!url) {
    throw new Error("브랜드커넥트 상품 URL을 입력해 주세요.");
  }

  if (!import.meta.env.DEV && !apiBase()) {
    throw new Error(
      "프로덕션 API가 아직 연결되지 않았습니다. 로컬에서는 npm run dev로 사용하거나 Worker + VITE_API_BASE를 설정해 주세요.",
    );
  }

  const root = apiBase();
  const endpoint = `${root}/api/brandconnect/product?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  const data = (await res.json()) as
    | BrandConnectLookupResponse
    | BrandConnectLookupError;

  if (!res.ok || !data.ok) {
    const message =
      !data.ok && data.message
        ? data.message
        : !data.ok
          ? data.error
          : `http_${res.status}`;
    throw new Error(message);
  }

  return data.product;
}
