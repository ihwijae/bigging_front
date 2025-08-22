import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 이 줄은 그대로 둡니다.

// https://vite.dev/config/
export default defineConfig({
  // plugins 배열에 tailwindcss()를 추가합니다.
  plugins: [react(), tailwindcss()],
})