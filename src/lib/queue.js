// src/lib/queue.js

// This file is written to work with both ES Modules and CommonJS
// It detects the environment and exports appropriately

// Detect if we're in ES Modules (Next.js) or CommonJS (worker scripts)
const isESM = typeof require === 'undefined' || !require.resolve;

// Helper to get Redis connection string or options from environment
function getRedisConfig() {
    // First check for a connection string
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    // Otherwise use individual components
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 30, // Increased from default for stability
        enableReadyCheck: false, // Can help with some stability issues
        connectTimeout: 10000, // 10 second timeout
        disconnectTimeout: 10000,
        retryStrategy: (times) => {
            // Exponential backoff
            return Math.min(times * 50, 2000); // Max 2 seconds delay
        },
    };
}

if (isESM) {
    // ES Module environment (Next.js)
    module.exports = async () => {
        try {
            // Dynamic import for ES Module environment
            const Bull = await import('bull');
            const Redis = await import('ioredis');

            console.log('Redis config:', getRedisConfig());

            // Create Redis clients for Bull with proper error handling
            const createRedisClient = () => {
                const redisClient = new Redis.default(getRedisConfig());

                redisClient.on('error', (err) => {
                    console.error('Redis client error:', err);
                });

                redisClient.on('connect', () => {
                    console.log('Redis client connected');
                });

                return redisClient;
            };

            // Create queues
            const emailCampaignQueue = new Bull.default('email-campaigns', {
                createClient: (type) => createRedisClient(),
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 100,
                },
            });

            const schedulerQueue = new Bull.default('campaign-scheduler', {
                createClient: (type) => createRedisClient(),
                defaultJobOptions: {
                    removeOnComplete: true,
                },
            });

            return { emailCampaignQueue, schedulerQueue };
        } catch (error) {
            console.error('Error initializing queues:', error);
            throw error;
        }
    };
} else {
    // CommonJS environment (worker scripts)
    try {
        const Bull = require('bull');
        const Redis = require('ioredis');

        console.log('Worker Redis config:', getRedisConfig());

        // Create Redis clients for Bull with proper error handling
        const createRedisClient = () => {
            const redisClient = new Redis(getRedisConfig());

            redisClient.on('error', (err) => {
                console.error('Worker Redis client error:', err);
            });

            redisClient.on('connect', () => {
                console.log('Worker Redis client connected');
            });

            return redisClient;
        };

        // Create queues
        const emailCampaignQueue = new Bull('email-campaigns', {
            createClient: (type) => createRedisClient(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        });

        const schedulerQueue = new Bull('campaign-scheduler', {
            createClient: (type) => createRedisClient(),
            defaultJobOptions: {
                removeOnComplete: true,
            },
        });

        module.exports = { emailCampaignQueue, schedulerQueue };
    } catch (error) {
        console.error('Error initializing worker queues:', error);
        throw error;
    }
}
