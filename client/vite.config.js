import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy removed: connecting directly to backend avoids Vite ECONNABORTED errors
  },
});
