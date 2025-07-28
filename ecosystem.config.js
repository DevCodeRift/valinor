module.exports = {
  apps: [
    {
      name: 'valinor-web',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000',
      cwd: '/var/www/valinor',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'valinor-bot',
      script: 'dist/index.js',
      cwd: '/var/www/valinor/bot',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/bot-err.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log'
    }
  ]
}
