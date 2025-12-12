module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // Production-ready rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Performance rules (relaxed for development)
    'react/jsx-no-bind': 'off', // Disabled for development ease
    'react/no-array-index-key': 'warn',
    
    // Security rules
    'react/no-danger': 'error',
    'react/jsx-no-script-url': 'error',
    'react/jsx-no-target-blank': 'error',
    
    // Testing library rules (relaxed)
    'testing-library/no-unnecessary-act': 'off',
    'testing-library/no-wait-for-multiple-assertions': 'off',
    
    // Import rules
    'import/first': 'error',
    
    // Accessibility rules (relaxed)
    'jsx-a11y/no-redundant-roles': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'testing-library/no-unnecessary-act': 'off',
        'testing-library/no-wait-for-multiple-assertions': 'off',
        'react/jsx-no-bind': 'off'
      }
    }
  ]
};