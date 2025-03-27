// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'maillayer-nextjs',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'email-worker',
            script: 'workers/email-processor.js',
            env: {
                NODE_ENV: 'production',
                REDIS_HOST: 'localhost',
                REDIS_PORT: '6379',
                MONGODB_URI: 'mongodb://localhost:27017/maillayer-client',
            },
        },
        {
            name: 'cron-checker',
            script: 'workers/cron-checker.js',
            env: {
                NODE_ENV: 'production',
                REDIS_HOST: 'localhost',
                REDIS_PORT: '6379',
                MONGODB_URI: 'mongodb://localhost:27017/maillayer-client',
            },
        },
    ],
};
