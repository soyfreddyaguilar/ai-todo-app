import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Test runner configuration (Vitest + jsdom + React Testing Library).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // main.jsx is the bootstrap entry point (createRoot call only).
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/__tests__/**'],
      // Spec-review floor: 40% lines (team practices). Never lowered to pass a step.
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
})
