import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:5001',
                changeOrigin: true,
                secure: false,
                timeout: 30000,
                proxyTimeout: 30000
            },
            '/socket.io': {
                target: 'http://localhost:5001',
                ws: true,
                changeOrigin: true,
                secure: false,
                timeout: 30000,
                proxyTimeout: 30000,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.error('[Vite Proxy] Socket error:', err.message);
                    });
                }
            }
        }
    }
})
