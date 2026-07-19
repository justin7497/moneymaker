import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteShoppingApiPlugin } from "./server/viteShoppingApiPlugin.ts";

// GitHub Pages project site: https://justin7497.github.io/moneymaker/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Expose NAVER_* to Vite middleware (not bundled into client)
  process.env.NAVER_CLIENT_ID = env.NAVER_CLIENT_ID ?? process.env.NAVER_CLIENT_ID;
  process.env.NAVER_CLIENT_SECRET =
    env.NAVER_CLIENT_SECRET ?? process.env.NAVER_CLIENT_SECRET;

  return {
    base: "/moneymaker/",
    plugins: [react(), viteShoppingApiPlugin()],
    server: {
      proxy: undefined,
    },
  };
});
