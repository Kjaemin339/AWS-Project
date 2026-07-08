import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // amazon-cognito-identity-js pulls in a Node `buffer` polyfill that references `global`
  define: {
    global: 'globalThis',
  },
});
