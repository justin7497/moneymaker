/**
 * Cloudflare Worker — 네이버 쇼핑 검색 프록시
 * Secrets: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/shopping/search" && url.pathname !== "/") {
      return json({ ok: false, error: "not_found" }, 404);
    }

    // Allow both / and /api/shopping/search for convenience
    if (request.method !== "GET") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const query = (url.searchParams.get("q") ?? "").trim();
    if (!query) {
      return json({ ok: false, error: "missing_query" }, 400);
    }

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

    try {
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
    } catch (error) {
      return json(
        {
          ok: false,
          error: "naver_request_failed",
          message: error instanceof Error ? error.message : "unknown_error",
        },
        502,
      );
    }
  },
};
