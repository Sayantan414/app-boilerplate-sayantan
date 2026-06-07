module.exports = {
  apps: [{
    name: "BOILERPLATE_API_DEV",
    script: './src/server.js',
    watch: ["src", ".env"],
    ignore_watch: ["node_modules", "public", ".git", "*.log", "ecosystem.config.js"],
    exp_backoff_restart_delay: 100,
    max_memory_restart: '900M',
    instances: 2,
    exec_mode: "cluster",
    env: {
      "PORT": 4065,
      "NODE_ENV": "development",
    },
    env_development: {
      "PORT": 4065,
      "NODE_ENV": "development",
    },
    env_production: {
      "PORT": 4068,
      "NODE_ENV": "production"
    }
  }],

  deploy: {
    development: {
      user: 'root',
      host: ['142.93.217.28'],
      ref: 'origin/develop',
      repo: 'git@bitbucket.org:programmersgroup/boilerplateapi.git',
      path: '/root/boilerplate-api-dev',
      key: "~/.ssh/softmeet_rsa",
      ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no", "ForwardAgent=yes"],
      agent_forward: true,
      'post-setup': "ls -la",
      'pre-deploy-local': "echo 'Install dependencies'",
      'post-deploy': "npm install && pm2 start ecosystem.config.js --watch --env development && pm2 save",
      env: {
        "NODE_ENV": "development"
      }
    },
    production: {
      user: 'root',
      host: ['142.93.217.28'],
      ref: 'origin/release',
      repo: 'git@bitbucket.org:programmersgroup/boilerplateapi.git',
      path: '/root/boilerplate-api',
      key: "~/.ssh/softmeet_rsa",
      ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no", "ForwardAgent=yes"],
      agent_forward: true,
      'post-setup': "ls -la",
      'pre-deploy-local': "echo 'Install dependencies'",
      'post-deploy': "npm install && pm2 start ecosystem.config.js --watch --env production && pm2 save",
      env: {
        "NODE_ENV": "production"
      }
    }
  }
};
