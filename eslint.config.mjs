import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'e2e-report/**', 'data/**', 'photos/**'] },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Las fotos se sirven desde endpoints propios que ya devuelven el
      // derivado correcto por stream; next/image no aporta nada encima.
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]

export default config
