import { defineConfig } from "vitest/config";

// Plain vitest config: scanner tests are pure functions and do not need the
// Cloudflare Vite plugin (which is only wired into vite.config.ts for builds).
export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
});
