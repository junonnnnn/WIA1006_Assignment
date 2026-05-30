import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const repoBase = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    // Only ship the single WASM variant ORT picks at runtime when numThreads=1
    // and no WebGPU is requested. Skips the 22 MB jsep / webgpu builds.
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
          dest: ".",
        },
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
          dest: ".",
        },
      ],
    }),
  ],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
