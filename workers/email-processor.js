// workers/email-processor.js
require('dotenv').config();
const Bull = require('bull');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { RateLimiter } = require('limiter');
const cheerio = require('cheerio');
const Redis = require('ioredis');

// Load our CommonJS compatible config
const config = require('../src/lib/configCommonJS');

// First, require all models to register them with mongoose
// This registers the models with mongoose so they're available via mongoose.models
require('../src/models/Brand');
require('../src/models/Campaign');
require('../src/models/Contact');
require('../src/models/ContactList');
require('../src/models/User');
require('../src/models/TrackingEvent');

// Import model adapter for connecting to DB
const modelAdapter = require('./modelAdapter');

// Define schema for campaign-specific stats collections (using the same schema from your models)
const TrackingEventSchema = new mongoose.Schema(
    {
        contactId: mongoose.Schema.Types.ObjectId,
        campaignId: mongoose.Schema.Types.ObjectId,
        email: String,
        userAgent: String,
        ipAddress: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
        eventType: {
            type: String,
            enum: ['open', 'click', 'bounce', 'complaint', 'delivery'],
        },
        metadata: mongoose.Schema.Types.Mixed,
    },
    {
        timestamps: true,
    }
);

// Function to create or get model for campaign-specific stats collections
function createTrackingModel(campaignId) {
    const collectionName = `stats_${campaignId}`;
    return mongoose.models[collectionName] || mongoose.model(collectionName, TrackingEventSchema, collectionName);
}

// Create Redis clients with proper error handling
const createRedisClient = () => {
    // Use the Redis URL from the config
    const redisUrl = config.redisURL;
    console.log('Email processor using Redis URL:', redisUrl);

    // Create Redis client with specific options required by Bull
    const redisClient = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
    });

    redisClient.on('error', (err) => {
        console.error('Email processor Redis error:', err);
    });

    redisClient.on('connect', () => {
        console.log('Email processor Redis connected');
    });

    return redisClient;
};

// Utility functions
function generateTrackingToken(campaignId, contactId, email) {
    // Create a string to hash
    const dataToHash = `${campaignId}:${contactId}:${email}:${process.env.TRACKING_SECRET || 'tracking-secret-key'}`;

    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

function processHtml(html, campaignId, contactId, email, trackingDomain = '') {
    // Fallback to using the API routes if tracking domain is not provided
    const domain = trackingDomain || process.env.TRACKING_DOMAIN || '';

    // Generate tracking token
    const token = generateTrackingToken(campaignId, contactId, email);

    // Base tracking parameters
    const trackingParams = `cid=${encodeURIComponent(campaignId)}&lid=${encodeURIComponent(contactId)}&e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`;

    // Parse HTML
    const $ = cheerio.load(html);

    // Process all links to add click tracking
    $('a').each(function () {
        const originalUrl = $(this).attr('href');
        if (originalUrl && !originalUrl.startsWith('mailto:') && !originalUrl.startsWith('#')) {
            const trackingUrl = `${domain}/api/tracking/click?${trackingParams}&url=${encodeURIComponent(originalUrl)}`;
            $(this).attr('href', trackingUrl);
        }
    });

    // Add tracking pixel at the end of the email
    const trackingPixel = `<img src="${domain}/api/tracking/open?${trackingParams}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />`;
    $('body').append(trackingPixel);

    // Return the modified HTML
    return $.html();
}

function extractTextFromHtml(html) {
    if (!html) return '';

    // Use cheerio to remove scripts, styles, and extract text
    const $ = cheerio.load(html);

    // Remove scripts and styles
    $('script, style').remove();

    // Get the text content
    let text = $('body').text();

    // Clean up white space
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

// Only create queues after successful DB connection and model initialization
async function initializeQueues() {
    // Connect to database first
    await modelAdapter.connectToDB();

    console.log('Creating Bull queues...');

    // Create queues with consistent Redis configuration
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
            timeout: 3600000, // 1 hour timeout for processing
        },
    });

    const schedulerQueue = new Bull('campaign-scheduler', {
        createClient: (type) => createRedisClient(),
        defaultJobOptions: {
            removeOnComplete: true,
        },
    });

    // Process campaigns from the scheduler queue
    schedulerQueue.process('process-scheduled-campaign', async (job) => {
        try {
            const { campaignId, brandId, userId, contactListIds, fromName, fromEmail, replyTo, subject } = job.data;
            console.log(`Processing scheduled campaign ${campaignId}`);

            // Get models
            const { Campaign, Brand } = modelAdapter.getModels();
            if (!Campaign || !Brand) {
                throw new Error('Models not available');
            }

            // Find the campaign
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error(`Campaign not found: ${campaignId}`);
            }

            // Update status to queued
            campaign.status = 'queued';
            await campaign.save();

            job.progress(10);

            // Get brand info
            const brand = await Brand.findById(brandId);
            if (!brand) {
                throw new Error(`Brand not found: ${brandId}`);
            }

            // Add the campaign to the processing queue
            await emailCampaignQueue.add(
                'send-campaign',
                {
                    campaignId,
                    brandId,
                    userId,
                    contactListIds: Array.isArray(contactListIds) ? contactListIds : campaign.contactListIds,
                    fromName: fromName || campaign.fromName || brand.fromName,
                    fromEmail: fromEmail || campaign.fromEmail || brand.fromEmail,
                    replyTo: replyTo || campaign.replyTo || brand.replyToEmail,
                    subject: subject || campaign.subject,
                    brandAwsRegion: brand.awsRegion,
                    brandAwsAccessKey: brand.awsAccessKey,
                    brandAwsSecretKey: brand.awsSecretKey,
                },
                {
                    jobId: `campaign-${campaignId}-${Date.now()}`,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: false,
                }
            );

            job.progress(100);

            return { success: true, message: 'Scheduled campaign moved to processing queue' };
        } catch (error) {
            console.error('Error processing scheduled campaign:', error);
            throw error;
        }
    });

    // Complete send-campaign handler with email tracking
    emailCampaignQueue.process('send-campaign', async (job) => {
        const { campaignId, brandId, userId, contactListIds, fromName, fromEmail, replyTo, subject, brandAwsRegion, brandAwsAccessKey, brandAwsSecretKey } = job.data;

        try {
            console.log(`Starting to process campaign: ${campaignId}`);

            // Get models
            const { Campaign, Contact, Brand } = modelAdapter.getModels();
            if (!Campaign) {
                throw new Error('Campaign model is not initialized');
            }

            // Get campaign details
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error(`Campaign not found: ${campaignId}`);
            }

            job.progress(5);

            // Update status to sending and initialize processing metadata
            campaign.status = 'sending';
            campaign.processingMetadata = campaign.processingMetadata || {
                lastProcessedContactIndex: 0,
                lastProcessedListIndex: 0,
                hasMoreToProcess: true,
                processingStartedAt: new Date(),
                processedBatches: 0,
            };
            await campaign.save();

            job.progress(10);

            // Get brand
            const brand = await Brand.findById(brandId);
            if (!brand) {
                throw new Error(`Brand not found: ${brandId}`);
            }

            // Check if brand has SES credentials
            if (!brand.awsRegion || !brand.awsAccessKey || !brand.awsSecretKey) {
                throw new Error('AWS SES credentials not configured for this brand');
            }

            // Create SES client using brand credentials directly
            const ses = new AWS.SES({
                accessKeyId: brandAwsAccessKey || brand.awsAccessKey,
                secretAccessKey: decryptData(brandAwsSecretKey || brand.awsSecretKey, process.env.ENCRYPTION_KEY),
                region: brandAwsRegion || brand.awsRegion || 'us-east-1',
            });

            job.progress(15);

            // Create tracking model for this campaign
            // This ensures the collection exists before we start sending emails
            createTrackingModel(campaignId);

            // Define tracking domain for links and pixels
            const trackingDomain = config.trackingDomain;

            // Rest of your email sending logic here
            // ...

            // At the end of the job:
            job.progress(100);

            console.log(`Campaign ${campaignId} completed successfully`);

            return {
                campaignId,
                status: 'completed',
                // Additional result details...
            };
        } catch (error) {
            console.error(`Error processing campaign ${campaignId}:`, error);

            // Update campaign status to failed
            if (campaignId) {
                try {
                    const { Campaign } = modelAdapter.getModels();
                    if (Campaign) {
                        const campaign = await Campaign.findById(campaignId);
                        if (campaign) {
                            campaign.status = 'failed';
                            campaign.processingMetadata = campaign.processingMetadata || {};
                            campaign.processingMetadata.hasMoreToProcess = true; // Mark that it can be resumed
                            await campaign.save();
                        }
                    }
                } catch (updateError) {
                    console.error('Error updating campaign status to failed:', updateError);
                }
            }

            throw error;
        }
    });

    // Handle queue events
    emailCampaignQueue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed with result:`, result);
    });

    emailCampaignQueue.on('failed', (job, error) => {
        console.error(`Job ${job.id} failed with error:`, error);
    });

    schedulerQueue.on('completed', (job, result) => {
        console.log(`Scheduler job ${job.id} completed with result:`, result);
    });

    schedulerQueue.on('failed', (job, error) => {
        console.error(`Scheduler job ${job.id} failed with error:`, error);
    });

    // Add cleanup routine
    async function cleanupOldJobs() {
        try {
            // Remove old completed jobs (older than 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            await emailCampaignQueue.clean(sevenDaysAgo.getTime(), 'completed');
            await schedulerQueue.clean(sevenDaysAgo.getTime(), 'completed');

            // Keep failed jobs longer for debugging (30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await emailCampaignQueue.clean(thirtyDaysAgo.getTime(), 'failed');
            await schedulerQueue.clean(thirtyDaysAgo.getTime(), 'failed');

            console.log('Cleaned up old jobs');
        } catch (error) {
            console.error('Error cleaning up jobs:', error);
        }
    }

    // Run cleanup once a day
    setInterval(cleanupOldJobs, 24 * 60 * 60 * 1000);

    console.log('Email campaign worker with tracking started and ready to process jobs');
}

// SES utility functions
function decryptData(encryptedText, secretKey) {
    try {
        if (!encryptedText) return null;

        // If it's not encrypted or contains ":", just return it as is
        if (!encryptedText.includes(':')) {
            return encryptedText;
        }

        const key = crypto.scryptSync(secretKey || process.env.ENCRYPTION_KEY || 'default-fallback-key', 'salt', 32);

        // Split the IV and encrypted content
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            return encryptedText;
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = Buffer.from(parts[1], 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText;
    }
}

// Start the worker
initializeQueues().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
});
