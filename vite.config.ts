import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/unreached/",
  plugins: [preact()],
  build: {
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: true,
    reportCompressedSize: true
  }
});
