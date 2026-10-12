import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "frontend"),
  publicDir: "public",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/uploads": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: resolve(projectRoot, "public"),
    emptyOutDir: true,
    assetsDir: "static",
    rollupOptions: {
      input: {
        home: resolve(projectRoot, "frontend/index.html"),
        login: resolve(projectRoot, "frontend/login.html"),
        records: resolve(projectRoot, "frontend/my-records.html"),
      },
    },
  },
});
