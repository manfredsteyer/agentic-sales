import { join } from 'node:path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [viteSingleFile()],
  build: {
    rolldownOptions: {
      input: join(import.meta.dirname, 'stock-widget.html'),
    },
  },
});
