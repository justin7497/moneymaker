export type BrandConnectProduct = {
  id: number;
  productName: string;
  salePrice?: number;
  discountedSalePrice?: number;
  discountedRate?: number;
  commissionRate?: number;
  promotionCommissionRate?: number;
  enabled?: boolean;
  storeName?: string;
  brandStore?: boolean;
  productUrl?: string;
  shortenUrl?: string;
  representativeProductImageUrl?: string;
  otherProductImageUrls?: string[];
  productDescriptionUrl?: string;
  affiliateStoreId?: number;
  sourceUrl: string;
  spaceId?: string;
};

export type BrandConnectLookupResponse = {
  ok: true;
  product: BrandConnectProduct;
};

export type BrandConnectLookupError = {
  ok: false;
  error: string;
  message?: string;
};

const BC_PRODUCT_URL_RE =
  /^https?:\/\/(?:www\.)?brandconnect\.naver\.com\/(\d+)\/affiliate\/products\/(\d+)\/?(?:\?.*)?$/i;

export function parseBrandConnectProductUrl(
  raw: string,
): { spaceId: string; productId: string } | null {
  const url = raw.trim();
  if (!url) return null;
  const match = url.match(BC_PRODUCT_URL_RE);
  if (!match) return null;
  return { spaceId: match[1], productId: match[2] };
}

export function formatBrandConnectPrice(price?: number): string {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return "";
  }
  return `${price.toLocaleString("ko-KR")}원`;
}

export function mapGatewayProduct(
  raw: Record<string, unknown>,
  sourceUrl: string,
  spaceId?: string,
): BrandConnectProduct {
  const otherImages = Array.isArray(raw.otherProductImageUrls)
    ? raw.otherProductImageUrls.filter((x): x is string => typeof x === "string")
    : undefined;

  return {
    id: Number(raw.id),
    productName: String(raw.productName ?? "").trim(),
    salePrice: typeof raw.salePrice === "number" ? raw.salePrice : undefined,
    discountedSalePrice:
      typeof raw.discountedSalePrice === "number"
        ? raw.discountedSalePrice
        : undefined,
    discountedRate:
      typeof raw.discountedRate === "number" ? raw.discountedRate : undefined,
    commissionRate:
      typeof raw.commissionRate === "number" ? raw.commissionRate : undefined,
    promotionCommissionRate:
      typeof raw.promotionCommissionRate === "number"
        ? raw.promotionCommissionRate
        : undefined,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : undefined,
    storeName:
      typeof raw.storeName === "string" ? raw.storeName.trim() : undefined,
    brandStore: typeof raw.brandStore === "boolean" ? raw.brandStore : undefined,
    productUrl:
      typeof raw.productUrl === "string" ? raw.productUrl.trim() : undefined,
    shortenUrl:
      typeof raw.shortenUrl === "string" ? raw.shortenUrl.trim() : undefined,
    representativeProductImageUrl:
      typeof raw.representativeProductImageUrl === "string"
        ? raw.representativeProductImageUrl.trim()
        : undefined,
    otherProductImageUrls: otherImages,
    productDescriptionUrl:
      typeof raw.productDescriptionUrl === "string"
        ? raw.productDescriptionUrl.trim()
        : undefined,
    affiliateStoreId:
      typeof raw.affiliateStoreId === "number" ? raw.affiliateStoreId : undefined,
    sourceUrl,
    spaceId,
  };
}

export async function fetchBrandConnectProduct(options: {
  productId: string;
  sourceUrl: string;
  spaceId?: string;
  cookie?: string;
}): Promise<BrandConnectProduct> {
  const url = `https://gw-brandconnect.naver.com/affiliate/query/affiliate-products/${encodeURIComponent(options.productId)}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    Origin: "https://brandconnect.naver.com",
    Referer: options.sourceUrl || "https://brandconnect.naver.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (options.cookie?.trim()) {
    headers.Cookie = options.cookie.trim();
  }

  const res = await fetch(url, { headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "brandconnect_auth_required: 브랜드커넥트 로그인 쿠키가 필요합니다. .env에 BRANDCONNECT_COOKIE를 설정해 주세요.",
    );
  }

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail?: unknown }).detail)
        : text.slice(0, 200);
    throw new Error(`brandconnect_api_${res.status}: ${detail}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("brandconnect_invalid_response");
  }

  const product = mapGatewayProduct(
    data as Record<string, unknown>,
    options.sourceUrl,
    options.spaceId,
  );
  if (!product.productName) {
    throw new Error("brandconnect_empty_product");
  }
  return product;
}
