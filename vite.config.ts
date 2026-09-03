import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.BASE_PATH
  ?? (repositoryName ? `/${repositoryName}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
