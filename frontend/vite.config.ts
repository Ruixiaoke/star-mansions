import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base：GitHub Pages 子路径 = 仓库名（部署到自定义域 / Vercel 时改回 '/'）。
export default defineConfig({
  plugins: [react()],
  base: "/star-mansions/",
  server: { port: 5173 },
});
