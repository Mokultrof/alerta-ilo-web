// Deployment configuration for Alerta Ilo
const deployConfig = {
  // Firebase Hosting Configuration
  hosting: {
    site: 'alerta-ilo',
    public: 'build',
    ignore: [
      'firebase.json',
      '**/.*',
      '**/node_modules/**'
    ],
    rewrites: [
      {
        source: '**',
        destination: '/index.html'
      }
    ]
  },

  // Build optimization settings
  build: {
    // Environment variables for production
    env: {
      REACT_APP_ENVIRONMENT: 'production',
      REACT_APP_USE_FIREBASE: 'true',
      REACT_APP_ENABLE_ANALYTICS: 'true',
      REACT_APP_ENABLE_PERFORMANCE_MONITORING: 'true'
    },
    
    // Build optimization flags
    optimization: {
      splitChunks: true,
      minimize: true,
      sourceMap: false
    }
  },

  // Security headers
  headers: [
    {
      source: '**/*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ]
    },
    {
      source: '/static/**',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ],

  // Performance monitoring
  performance: {
    budgets: [
      {
        type: 'initial',
        maximumWarning: '500kb',
        maximumError: '1mb'
      },
      {
        type: 'anyComponentStyle',
        maximumWarning: '2kb',
        maximumError: '4kb'
      }
    ]
  }
};

module.exports = deployConfig;