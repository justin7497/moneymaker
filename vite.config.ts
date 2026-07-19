import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteApiPlugin } from "./server/viteApiPlugin.ts";

// GitHub Pages project site: https://justin7497.github.io/moneymaker/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.NAVER_CLIENT_ID = env.NAVER_CLIENT_ID ?? process.env.NAVER_CLIENT_ID;
  process.env.NAVER_CLIENT_SECRET =
    env.NAVER_CLIENT_SECRET ?? process.env.NAVER_CLIENT_SECRET;
  process.env.BRANDCONNECT_COOKIE =
    env.BRANDCONNECT_COOKIE ?? process.env.BRANDCONNECT_COOKIE;

  return {
    base: "/moneymaker/",
    plugins: [react(), viteApiPlugin()],
  };
});
