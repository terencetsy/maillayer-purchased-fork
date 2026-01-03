// src/lib/queue.js
// Queue initialization for Next.js API routes (ES Modules)

// Get Redis URL
function getRedisUrl() {
    return process.env.REDIS_URL || 'redis://localhost:6379';
}

// Cache for queue instances
let queueInstance = null;

// Initialize queues (lazy loading)
async function initializeQueues() {
    if (queueInstance) {
        return queueInstance;
    }

    try {
        // Dynamic imports for ES Module environment
        const Bull = (await import('bull')).default;
        const Redis = (await import('ioredis')).default;

        const redisUrl = getRedisUrl();

        // Create Redis clients for Bull with proper error handling
        const createRedisClient = () => {
            const redisClient = new Redis(redisUrl, {
                enableReadyCheck: false,
                maxRetriesPerRequest: null,
            });

            redisClient.on('error', (err) => {
                console.error('Redis client error:', err.message);
            });

            return redisClient;
        };

        // Create queues
        const emailCampaignQueue = new Bull('email-campaigns', {
            createClient: () => createRedisClient(),
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
            createClient: () => createRedisClient(),
            defaultJobOptions: {
                removeOnComplete: true,
            },
        });

        queueInstance = { emailCampaignQueue, schedulerQueue };
        return queueInstance;
    } catch (error) {
        console.error('Error initializing queues:', error);
        throw error;
    }
}

// Export the async initializer function
export default initializeQueues;
export { initializeQueues, getRedisUrl };
