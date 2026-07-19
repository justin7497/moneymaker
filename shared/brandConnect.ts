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

export type BrandConnectSearchResponse = {
  ok: true;
  spaceId: string;
  query: string;
  items: BrandConnectProduct[];
};

export type BrandConnectLookupError = {
  ok: false;
  error: string;
  message?: string;
};

export type ParsedBrandConnectUrl =
  | { kind: "product"; spaceId: string; productId: string }
  | { kind: "list"; spaceId: string };

const BC_PRODUCT_URL_RE =
  /^https?:\/\/(?:www\.)?brandconnect\.naver\.com\/(\d+)\/affiliate\/products\/(\d+)\/?(?:\?.*)?$/i;

const BC_LIST_URL_RE =
  /^https?:\/\/(?:www\.)?brandconnect\.naver\.com\/(\d+)\/affiliate\/products\/?(?:\?.*)?$/i;

export function parseBrandConnectUrl(raw: string): ParsedBrandConnectUrl | null {
  const url = raw.trim();
  if (!url) return null;

  const product = url.match(BC_PRODUCT_URL_RE);
  if (product) {
    return { kind: "product", spaceId: product[1], productId: product[2] };
  }

  const list = url.match(BC_LIST_URL_RE);
  if (list) {
    return { kind: "list", spaceId: list[1] };
  }

  return null;
}

/** @deprecated use parseBrandConnectUrl */
export function parseBrandConnectProductUrl(
  raw: string,
): { spaceId: string; productId: string } | null {
  const parsed = parseBrandConnectUrl(raw);
  if (!parsed || parsed.kind !== "product") return null;
  return { spaceId: parsed.spaceId, productId: parsed.productId };
}

export function formatBrandConnectPrice(price?: number): string {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return "";
  }
  return `${price.toLocaleString("ko-KR")}원`;
}

export function productDetailUrl(spaceId: string, productId: string | number): string {
  return `https://brandconnect.naver.com/${spaceId}/affiliate/products/${productId}`;
}

function gatewayHeaders(sourceUrl: string, cookie?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Origin: "https://brandconnect.naver.com",
    Referer: sourceUrl || "https://brandconnect.naver.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (cookie?.trim()) {
    headers.Cookie = cookie.trim();
  }
  return headers;
}

async function gatewayGet(pathname: string, sourceUrl: string, cookie?: string) {
  const url = `https://gw-brandconnect.naver.com${pathname}`;
  const res = await fetch(url, { headers: gatewayHeaders(sourceUrl, cookie) });
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

  return data;
}

export function mapGatewayProduct(
  raw: Record<string, unknown>,
  sourceUrl: string,
  spaceId?: string,
): BrandConnectProduct {
  const otherImages = Array.isArray(raw.otherProductImageUrls)
    ? raw.otherProductImageUrls.filter((x): x is string => typeof x === "string")
    : undefined;

  const priceObj =
    raw.price && typeof raw.price === "object"
      ? (raw.price as Record<string, unknown>)
      : null;

  const id = Number(raw.id ?? raw.affiliateProductId);
  const salePrice =
    typeof raw.salePrice === "number"
      ? raw.salePrice
      : typeof priceObj?.salePrice === "number"
        ? priceObj.salePrice
        : undefined;
  const discountedSalePrice =
    typeof raw.discountedSalePrice === "number"
      ? raw.discountedSalePrice
      : typeof priceObj?.discountedSalePrice === "number"
        ? priceObj.discountedSalePrice
        : undefined;
  const discountedRate =
    typeof raw.discountedRate === "number"
      ? raw.discountedRate
      : typeof priceObj?.discountedRate === "number"
        ? priceObj.discountedRate
        : undefined;

  const image =
    (typeof raw.representativeProductImageUrl === "string" &&
      raw.representativeProductImageUrl.trim()) ||
    (typeof raw.productImageUrl === "string" && raw.productImageUrl.trim()) ||
    undefined;

  return {
    id,
    productName: String(raw.productName ?? "").trim(),
    salePrice,
    discountedSalePrice,
    discountedRate,
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
    representativeProductImageUrl: image,
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

function extractProductList(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  }
  if (typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;

  for (const key of ["contents", "content", "items", "products", "affiliateProducts"]) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    }
  }

  // store-grouped banners: [{ products: [...] }]
  if (Array.isArray(obj.stores)) {
    const nested: Record<string, unknown>[] = [];
    for (const store of obj.stores) {
      if (!store || typeof store !== "object") continue;
      const s = store as Record<string, unknown>;
      const products = Array.isArray(s.products) ? s.products : [];
      for (const p of products) {
        if (p && typeof p === "object") {
          nested.push({
            ...(p as Record<string, unknown>),
            storeName:
              typeof s.storeName === "string"
                ? s.storeName
                : (p as Record<string, unknown>).storeName,
            brandStore:
              typeof s.brandStore === "boolean"
                ? s.brandStore
                : (p as Record<string, unknown>).brandStore,
          });
        }
      }
    }
    if (nested.length) return nested;
  }

  return [];
}

export async function fetchBrandConnectProduct(options: {
  productId: string;
  sourceUrl: string;
  spaceId?: string;
  cookie?: string;
}): Promise<BrandConnectProduct> {
  const data = await gatewayGet(
    `/affiliate/query/affiliate-products/${encodeURIComponent(options.productId)}`,
    options.sourceUrl,
    options.cookie,
  );

  if (!data || typeof data !== "object") {
    throw new Error("brandconnect_invalid_response");
  }

  const product = mapGatewayProduct(
    data as Record<string, unknown>,
    options.sourceUrl,
    options.spaceId,
  );
  if (!product.productName || !Number.isFinite(product.id)) {
    throw new Error("brandconnect_empty_product");
  }
  return product;
}

export async function searchBrandConnectProducts(options: {
  spaceId: string;
  query: string;
  cookie?: string;
  page?: number;
  size?: number;
}): Promise<BrandConnectProduct[]> {
  const query = options.query.trim();
  if (!query) {
    throw new Error("검색어를 입력해 주세요. 예: 차량용 무선 충전기");
  }

  const page = options.page ?? 0;
  const size = options.size ?? 20;
  const sourceUrl = `https://brandconnect.naver.com/${options.spaceId}/affiliate/products`;
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
  });

  const data = await gatewayGet(
    `/affiliate/query/affiliate-products/search-by-query?${params.toString()}`,
    sourceUrl,
    options.cookie,
  );

  const rows = extractProductList(data);
  return rows
    .map((row) => {
      const mapped = mapGatewayProduct(row, sourceUrl, options.spaceId);
      if (!mapped.productName || !Number.isFinite(mapped.id)) return null;
      return {
        ...mapped,
        sourceUrl: productDetailUrl(options.spaceId, mapped.id),
      };
    })
    .filter((x): x is BrandConnectProduct => x !== null);
}
