module.exports = {
  apps: [
    {
      name: 'nextjs-admin',
      cwd: './',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'fastify-bff',
      cwd: './bff',
      script: 'dist/server.js',
      env: {
        PORT: 3001,
        BFF_PORT: 3001,
        BFF_HOST: '127.0.0.1',
        NODE_ENV: 'production',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: '../logs/bff-error.log',
      out_file: '../logs/bff-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
