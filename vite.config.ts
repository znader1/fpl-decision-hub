import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Local dev helper to avoid CORS when hitting FastAPI directly.
      // Use `VITE_FPL_TEAM_RECOMMENDATION_URL="/recommendations?..."`
      "/recommendations": {
        target: process.env.VITE_FPL_API_BASE_URL ?? "https://fpl-refresh-app.whitestone-9a91372e.francecentral.azurecontainerapps.io/",
        changeOrigin: true,
      },
      "/squad": {
        target: process.env.VITE_FPL_API_BASE_URL ?? "https://fpl-refresh-app.whitestone-9a91372e.francecentral.azurecontainerapps.io/",
        changeOrigin: true,
      },
      "/fixtures": {
        target: process.env.VITE_FPL_API_BASE_URL ?? "https://fpl-refresh-app.whitestone-9a91372e.francecentral.azurecontainerapps.io/",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
