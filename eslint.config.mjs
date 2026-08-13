import neostandard from 'neostandard'

export default [
  ...neostandard({
    ignores: ['dist', 'docs'],
  }),
  {
    rules: {
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
  },
]
