import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://justin7497.github.io/moneymaker/
export default defineConfig({
  base: "/moneymaker/",
  plugins: [react()],
});
