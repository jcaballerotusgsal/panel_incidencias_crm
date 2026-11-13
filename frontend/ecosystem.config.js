/** Ejecuta el frontend standalone compilado; preparar antes public y .next/static según docs/pm2.md. */
module.exports = {
  apps: [{
    name: 'crm-sac-frontend',
    cwd: __dirname,
    script: '.next/standalone/server.js',
    interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    autorestart: true,
    restart_delay: 5000,
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 15000,
    env: {
      NODE_ENV: 'production',
      PORT: 3010,
      HOSTNAME: '127.0.0.1',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  }],
};
