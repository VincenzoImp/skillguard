import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

type BuildEnv = {
  VITE_BASE_PATH?: string;
};

export function getBasePath(env: BuildEnv = runtimeEnv()) {
  return env.VITE_BASE_PATH ?? "/";
}

function runtimeEnv(): BuildEnv {
  const runtime = globalThis as {
    process?: { env?: BuildEnv };
  };
  return runtime.process?.env ?? {};
}

export default defineConfig({
  base: getBasePath(),
  plugins: [react(), tailwindcss()],
});
