// @ts-check
import { defineConfig } from "astro/config";
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
	base: process.env.BASE_PATH || "/JavaScriptOnTheBrain/",
	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `$base-path: "${process.env.BASE_PATH || "/JavaScriptOnTheBrain/"}";`
				}
			}
		},
		plugins: [yaml()]
	}
});
