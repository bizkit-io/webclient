import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    envFile: '.env',
    dts: {
      tsgo: true,
    },
    exports: true,
    minify: true,
    platform: 'browser',
    banner: '// Copyright (c) 2026 bizkit.io\n// SPDX-License-Identifier: MIT\n',
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    singleQuote: true,
  },
});
