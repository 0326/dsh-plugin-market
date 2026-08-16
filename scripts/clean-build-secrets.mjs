import { unlink } from "node:fs/promises";

const generatedVars = new URL("../dist/dsh_plugin_market/.dev.vars", import.meta.url);
try {
	await unlink(generatedVars);
} catch (error) {
	if (error?.code !== "ENOENT") throw error;
}
