module.exports = {
  apps: [
    {
      name: 'telebirr-verifier-api',
      script: 'dist/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'telebirr-verifier-webhook-worker',
      script: 'dist/src/workers/webhook.worker.js',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
