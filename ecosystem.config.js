// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'maillayer-nextjs',
            script: 'npm',
            args: 'run dev -- -H 0.0.0.0', // Note the -H 0.0.0.0 flag
            env: {
                NODE_ENV: 'development',
            },
        },
        {
            name: 'email-worker',
            script: 'workers/email-processor.js',
            env: {
                NODE_ENV: 'development',
            },
        },
        {
            name: 'cron-checker',
            script: 'workers/cron-checker.js',
            env: {
                NODE_ENV: 'development',
            },
        },
        {
            name: 'campaign-manager',
            script: 'workers/campaign-manager.js',
            env: {
                NODE_ENV: 'development',
            },
        },
    ],
};
