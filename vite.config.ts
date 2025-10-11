import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
  plugins: [react()],
  server: {
    // 配置代理，将请求转发到后端服务
    proxy: {
      '/events': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 添加其他可能需要的API代理
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
