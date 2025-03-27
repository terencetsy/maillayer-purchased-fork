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
            },
        },
        {
            name: 'cron-checker',
            script: 'workers/cron-checker.js',
            env: {
                NODE_ENV: 'production',
            },
        },
        {
            name: 'campaign-manager',
            script: 'workers/campaign-manager.js',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
