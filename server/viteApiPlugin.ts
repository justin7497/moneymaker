import type { Plugin } from "vite";
import {
  fetchBrandConnectProduct,
  parseBrandConnectUrl,
  searchBrandConnectProducts,
} from "../shared/brandConnect.ts";
import { fetchNaverShoppingSearch } from "../shared/naverShopping.ts";

function sendJson(
  res: import("http").ServerResponse,
  status: number,
  body: unknown,
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function requireCookie(
  res: import("http").ServerResponse,
): string | null {
  const cookie = process.env.BRANDCONNECT_COOKIE?.trim() ?? "";
  if (!cookie) {
    sendJson(res, 503, {
      ok: false,
      error: "brandconnect_cookie_missing",
      message:
        "브랜드커넥트는 로그인 세션이 필요합니다. 브라우저에서 로그인 후 Cookie를 복사해 .env의 BRANDCONNECT_COOKIE에 넣어 주세요.",
    });
    return null;
  }
  return cookie;
}

export function viteApiPlugin(): Plugin {
  return {
    name: "moneymaker-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, "http://localhost") : null;
        if (!url) {
          next();
          return;
        }

        if (url.pathname === "/api/brandconnect/product") {
          if (req.method !== "GET") {
            sendJson(res, 405, { ok: false, error: "method_not_allowed" });
            return;
          }

          const rawUrl = (url.searchParams.get("url") ?? "").trim();
          const parsed = parseBrandConnectUrl(rawUrl);
          if (!parsed || parsed.kind !== "product") {
            sendJson(res, 400, {
              ok: false,
              error: "invalid_brandconnect_url",
              message:
                "상품 상세 URL이 필요합니다. 예: https://brandconnect.naver.com/{spaceId}/affiliate/products/{productId}",
            });
            return;
          }

          const cookie = requireCookie(res);
          if (!cookie) return;

          try {
            const product = await fetchBrandConnectProduct({
              productId: parsed.productId,
              spaceId: parsed.spaceId,
              sourceUrl: rawUrl,
              cookie,
            });
            sendJson(res, 200, { ok: true, product });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "unknown_error";
            const status = message.includes("auth_required") ? 401 : 502;
            sendJson(res, status, {
              ok: false,
              error: "brandconnect_request_failed",
              message,
            });
          }
          return;
        }

        if (url.pathname === "/api/brandconnect/products") {
          if (req.method !== "GET") {
            sendJson(res, 405, { ok: false, error: "method_not_allowed" });
            return;
          }

          const rawUrl = (url.searchParams.get("url") ?? "").trim();
          const query = (url.searchParams.get("q") ?? "").trim();
          const parsed = parseBrandConnectUrl(rawUrl);

          if (!parsed) {
            sendJson(res, 400, {
              ok: false,
              error: "invalid_brandconnect_url",
              message:
                "브랜드커넥트 URL 형식이 아닙니다. 예: https://brandconnect.naver.com/{spaceId}/affiliate/products",
            });
            return;
          }

          const cookie = requireCookie(res);
          if (!cookie) return;

          try {
            if (parsed.kind === "product") {
              const product = await fetchBrandConnectProduct({
                productId: parsed.productId,
                spaceId: parsed.spaceId,
                sourceUrl: rawUrl,
                cookie,
              });
              sendJson(res, 200, {
                ok: true,
                spaceId: parsed.spaceId,
                query: "",
                items: [product],
              });
              return;
            }

            const items = await searchBrandConnectProducts({
              spaceId: parsed.spaceId,
              query,
              cookie,
              page: 0,
              size: 20,
            });
            sendJson(res, 200, {
              ok: true,
              spaceId: parsed.spaceId,
              query,
              items,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "unknown_error";
            const status = message.includes("auth_required") ? 401 : 502;
            sendJson(res, status, {
              ok: false,
              error: "brandconnect_request_failed",
              message,
            });
          }
          return;
        }

        if (url.pathname === "/api/shopping/search") {
          if (req.method !== "GET") {
            sendJson(res, 405, { ok: false, error: "method_not_allowed" });
            return;
          }

          const query = (url.searchParams.get("q") ?? "").trim();
          if (!query) {
            sendJson(res, 400, { ok: false, error: "missing_query" });
            return;
          }

          const clientId = process.env.NAVER_CLIENT_ID?.trim() ?? "";
          const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim() ?? "";
          if (!clientId || !clientSecret) {
            sendJson(res, 503, {
              ok: false,
              error: "naver_not_configured",
              message:
                ".env에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET을 설정해 주세요.",
            });
            return;
          }

          try {
            const items = await fetchNaverShoppingSearch({
              query,
              clientId,
              clientSecret,
              display: 10,
              sort: "sim",
            });
            sendJson(res, 200, { ok: true, query, items });
          } catch (error) {
            sendJson(res, 502, {
              ok: false,
              error: "naver_request_failed",
              message: error instanceof Error ? error.message : "unknown_error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}
