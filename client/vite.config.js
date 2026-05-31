import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the client directory (.env)
  const env = loadEnv(mode, process.cwd(), '');
  
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:5000';

  console.log(`=========================================`);
  console.log(`[Vite Dev Server] Proxy Target: ${backendTarget}`);
  console.log(`=========================================`);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/p/': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})
