import type { Plugin } from "vite";
import { fetchNaverShoppingSearch } from "../shared/naverShopping.ts";

function sendJson(res: import("http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function viteShoppingApiPlugin(): Plugin {
  return {
    name: "moneymaker-shopping-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, "http://localhost") : null;
        if (!url || url.pathname !== "/api/shopping/search") {
          next();
          return;
        }

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
      });
    },
  };
}
