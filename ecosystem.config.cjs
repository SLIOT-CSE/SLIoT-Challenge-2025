// PM2 process definition for the production Next.js server.
// First start on the server:  pm2 start ecosystem.config.cjs && pm2 save
// Deploys run:                pm2 reload ecosystem.config.cjs --update-env
module.exports = {
  apps: [
    {
      name: "sliot-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      // Listen on localhost only; nginx is the public entry point
      args: "start --hostname 127.0.0.1",
      // One process is plenty for this traffic; image optimisation is cached in .next/cache/images
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        // nginx proxies to this port on localhost; change both together
        PORT: 3000,
      },
      max_memory_restart: "700M",
      time: true,
    },
  ],
};
