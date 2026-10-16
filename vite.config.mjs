// Plugins
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import fs from "fs";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		VueRouter(),
		Vue({
			template: { transformAssetUrls },
		}),
		// https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
		Vuetify({
			autoImport: true,
			styles: {
				configFile: "src/styles/settings.scss",
			},
		}),
		Components(),

		AutoImport({
			imports: ["vue", "vue-router"],
			eslintrc: {
				enabled: true,
			},
			vueTemplate: true,
		}),
	],
	define: { "process.env": {} },
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
		extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
	},
	build: {
		outDir: "docs",
	},
	server: {
		port: 3000,
		https: fs.existsSync(resolve(__dirname, "localhost-key.pem")) &&
			fs.existsSync(resolve(__dirname, "localhost.pem")) ? {
			key: fs.readFileSync(resolve(__dirname, "localhost-key.pem")),
			cert: fs.readFileSync(resolve(__dirname, "localhost.pem")),
		} : undefined,
	},
});
