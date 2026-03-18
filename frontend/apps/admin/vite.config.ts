import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) {
    return
  }
  if (id.includes('/echarts/') || id.includes('/zrender/') || id.includes('echarts-for-react')) {
    return 'vendor-echarts'
  }
  if (
    id.includes('/antd/') ||
    id.includes('@ant-design') ||
    id.includes('/rc-') ||
    id.includes('react-router') ||
    id.includes('@remix-run/router') ||
    id.includes('/react/') ||
    id.includes('react-dom') ||
    id.includes('scheduler') ||
    id.includes('react-is') ||
    id.includes('dayjs') ||
    id.includes('classnames')
  ) {
    return 'vendor-ui'
  }
  return 'vendor-misc'
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3002,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  }
})
