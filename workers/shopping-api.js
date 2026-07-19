/**
 * Cloudflare Worker — moneymaker API
 * Secrets: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, BRANDCONNECT_COOKIE
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BC_PRODUCT_URL_RE =
  /^https?:\/\/(?:www\.)?brandconnect\.naver\.com\/(\d+)\/affiliate\/products\/(\d+)\/?(?:\?.*)?$/i;
const BC_LIST_URL_RE =
  /^https?:\/\/(?:www\.)?brandconnect\.naver\.com\/(\d+)\/affiliate\/products\/?(?:\?.*)?$/i;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function stripHtml(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function mapItems(items) {
  return (items ?? [])
    .map((item) => {
      const title = stripHtml(item.title ?? "");
      if (!title) return null;
      return {
        title,
        link: (item.link ?? "").trim(),
        image: (item.image ?? "").trim(),
        lprice: (item.lprice ?? "").trim(),
        hprice: item.hprice?.trim() || undefined,
        mallName: item.mallName?.trim() || undefined,
        brand: item.brand?.trim() || undefined,
        maker: item.maker?.trim() || undefined,
        productId: item.productId?.trim() || undefined,
        category1: item.category1?.trim() || undefined,
        category2: item.category2?.trim() || undefined,
        category3: item.category3?.trim() || undefined,
        category4: item.category4?.trim() || undefined,
      };
    })
    .filter(Boolean);
}

function mapBrandConnectProduct(raw, sourceUrl, spaceId) {
  const otherImages = Array.isArray(raw.otherProductImageUrls)
    ? raw.otherProductImageUrls.filter((x) => typeof x === "string")
    : undefined;
  const priceObj =
    raw.price && typeof raw.price === "object" ? raw.price : null;
  const id = Number(raw.id ?? raw.affiliateProductId);
  const image =
    (typeof raw.representativeProductImageUrl === "string" &&
      raw.representativeProductImageUrl.trim()) ||
    (typeof raw.productImageUrl === "string" && raw.productImageUrl.trim()) ||
    undefined;

  return {
    id,
    productName: String(raw.productName ?? "").trim(),
    salePrice:
      typeof raw.salePrice === "number"
        ? raw.salePrice
        : typeof priceObj?.salePrice === "number"
          ? priceObj.salePrice
          : undefined,
    discountedSalePrice:
      typeof raw.discountedSalePrice === "number"
        ? raw.discountedSalePrice
        : typeof priceObj?.discountedSalePrice === "number"
          ? priceObj.discountedSalePrice
          : undefined,
    discountedRate:
      typeof raw.discountedRate === "number"
        ? raw.discountedRate
        : typeof priceObj?.discountedRate === "number"
          ? priceObj.discountedRate
          : undefined,
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

function extractProductList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter((x) => x && typeof x === "object");
  for (const key of ["contents", "content", "items", "products", "affiliateProducts"]) {
    if (Array.isArray(data[key])) return data[key].filter((x) => x && typeof x === "object");
  }
  if (Array.isArray(data.stores)) {
    const nested = [];
    for (const store of data.stores) {
      if (!store || typeof store !== "object") continue;
      for (const p of store.products || []) {
        if (p && typeof p === "object") {
          nested.push({
            ...p,
            storeName: store.storeName || p.storeName,
            brandStore:
              typeof store.brandStore === "boolean" ? store.brandStore : p.brandStore,
          });
        }
      }
    }
    return nested;
  }
  return [];
}

async function gatewayFetch(pathname, referer, cookie) {
  const res = await fetch(`https://gw-brandconnect.naver.com${pathname}`, {
    headers: {
      Accept: "application/json",
      Origin: "https://brandconnect.naver.com",
      Referer: referer,
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { res, text, data };
}

async function handleBrandConnectProduct(url, env) {
  const rawUrl = (url.searchParams.get("url") ?? "").trim();
  const match = rawUrl.match(BC_PRODUCT_URL_RE);
  if (!match) {
    return json(
      {
        ok: false,
        error: "invalid_brandconnect_url",
        message:
          "상품 상세 URL이 필요합니다. 예: https://brandconnect.naver.com/{spaceId}/affiliate/products/{productId}",
      },
      400,
    );
  }

  const cookie = (env.BRANDCONNECT_COOKIE ?? "").trim();
  if (!cookie) {
    return json(
      {
        ok: false,
        error: "brandconnect_cookie_missing",
        message: "Worker secret BRANDCONNECT_COOKIE가 필요합니다.",
      },
      503,
    );
  }

  const spaceId = match[1];
  const productId = match[2];
  const { res, text, data } = await gatewayFetch(
    `/affiliate/query/affiliate-products/${encodeURIComponent(productId)}`,
    rawUrl,
    cookie,
  );

  if (res.status === 401 || res.status === 403) {
    return json(
      {
        ok: false,
        error: "brandconnect_auth_required",
        message: "브랜드커넥트 로그인 쿠키가 만료됐거나 권한이 없습니다.",
      },
      401,
    );
  }
  if (!res.ok || !data || typeof data !== "object") {
    return json(
      {
        ok: false,
        error: "brandconnect_request_failed",
        message: `brandconnect_api_${res.status}: ${text.slice(0, 200)}`,
      },
      502,
    );
  }

  const product = mapBrandConnectProduct(data, rawUrl, spaceId);
  if (!product.productName) {
    return json({ ok: false, error: "brandconnect_empty_product" }, 502);
  }
  return json({ ok: true, product });
}

async function handleBrandConnectProducts(url, env) {
  const rawUrl = (url.searchParams.get("url") ?? "").trim();
  const query = (url.searchParams.get("q") ?? "").trim();
  const productMatch = rawUrl.match(BC_PRODUCT_URL_RE);
  const listMatch = rawUrl.match(BC_LIST_URL_RE);

  const cookie = (env.BRANDCONNECT_COOKIE ?? "").trim();
  if (!cookie) {
    return json(
      {
        ok: false,
        error: "brandconnect_cookie_missing",
        message: "Worker secret BRANDCONNECT_COOKIE가 필요합니다.",
      },
      503,
    );
  }

  if (productMatch) {
    const detail = await handleBrandConnectProduct(url, env);
    const body = await detail.json();
    if (!body.ok) return json(body, detail.status);
    return json({
      ok: true,
      spaceId: productMatch[1],
      query: "",
      items: [body.product],
    });
  }

  if (!listMatch) {
    return json(
      {
        ok: false,
        error: "invalid_brandconnect_url",
        message:
          "브랜드커넥트 URL 형식이 아닙니다. 예: https://brandconnect.naver.com/{spaceId}/affiliate/products",
      },
      400,
    );
  }

  if (!query) {
    return json(
      {
        ok: false,
        error: "missing_query",
        message: "목록 URL에서는 검색어(q)가 필요합니다.",
      },
      400,
    );
  }

  const spaceId = listMatch[1];
  const params = new URLSearchParams({ query, page: "0", size: "20" });
  const { res, text, data } = await gatewayFetch(
    `/affiliate/query/affiliate-products/search-by-query?${params}`,
    rawUrl,
    cookie,
  );

  if (res.status === 401 || res.status === 403) {
    return json(
      {
        ok: false,
        error: "brandconnect_auth_required",
        message: "브랜드커넥트 로그인 쿠키가 만료됐거나 권한이 없습니다.",
      },
      401,
    );
  }
  if (!res.ok) {
    return json(
      {
        ok: false,
        error: "brandconnect_request_failed",
        message: `brandconnect_api_${res.status}: ${text.slice(0, 200)}`,
      },
      502,
    );
  }

  const items = extractProductList(data)
    .map((row) => {
      const mapped = mapBrandConnectProduct(
        row,
        `https://brandconnect.naver.com/${spaceId}/affiliate/products/${row.id || row.affiliateProductId}`,
        spaceId,
      );
      return mapped.productName && Number.isFinite(mapped.id) ? mapped : null;
    })
    .filter(Boolean);

  return json({ ok: true, spaceId, query, items });
}

async function handleShoppingSearch(url, env) {
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return json({ ok: false, error: "missing_query" }, 400);

  const clientId = (env.NAVER_CLIENT_ID ?? "").trim();
  const clientSecret = (env.NAVER_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) {
    return json(
      {
        ok: false,
        error: "naver_not_configured",
        message: "Worker secrets NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 필요",
      },
      503,
    );
  }

  const api = new URL("https://openapi.naver.com/v1/search/shop.json");
  api.searchParams.set("query", query);
  api.searchParams.set("display", "10");
  api.searchParams.set("sort", "sim");

  const res = await fetch(api.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return json(
      {
        ok: false,
        error: "naver_request_failed",
        message: `naver_api_${res.status}: ${text.slice(0, 200)}`,
      },
      502,
    );
  }

  const data = await res.json();
  return json({ ok: true, query, items: mapItems(data.items) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "GET") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/brandconnect/product") {
      return handleBrandConnectProduct(url, env);
    }
    if (url.pathname === "/api/brandconnect/products") {
      return handleBrandConnectProducts(url, env);
    }
    if (url.pathname === "/api/shopping/search" || url.pathname === "/") {
      if (url.pathname === "/" && !url.searchParams.get("q")) {
        return json({
          ok: true,
          service: "moneymaker-api",
          endpoints: [
            "/api/brandconnect/product",
            "/api/brandconnect/products",
            "/api/shopping/search",
          ],
        });
      }
      return handleShoppingSearch(url, env);
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
