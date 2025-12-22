// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: ["avatars.githubusercontent.com", "github.com"],
  },
  output: "static",
  site: "https://lyoss-usm.github.io",
  compressHTML: true,
  integrations: [mdx()],
});
