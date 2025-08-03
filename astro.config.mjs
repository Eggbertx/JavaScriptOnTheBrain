// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	base: process.env.BASE_PATH || "/JavaScriptOnTheBrain/",
	build: {
		format: "file"
	},
	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `$base-path: "${process.env.BASE_PATH || "/JavaScriptOnTheBrain/"}";`
				}
			}
		}
	}
});
