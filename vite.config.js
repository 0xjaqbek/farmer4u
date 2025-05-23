import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': JSON.stringify(''),
    'process.versions': JSON.stringify({}),
    'process.platform': JSON.stringify('browser'),
    'process.browser': true
  },
  optimizeDeps: {
    include: [
      '@coral-xyz/anchor',
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      'buffer'
    ]
  }
})