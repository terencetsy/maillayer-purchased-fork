// workers/email-processor.js
require('dotenv').config();
const Bull = require('bull');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const { RateLimiter } = require('limiter');

// Setup Redis connection for Bull
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
};

// Create queues
const emailCampaignQueue = new Bull('email-campaigns', {
    redis: redisOptions,
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
    redis: redisOptions,
    defaultJobOptions: {
        removeOnComplete: true,
    },
});

// We need to define models here because the models in src/models use ES Module syntax
// which isn't compatible with CommonJS require() without special configuration
const CampaignSchema = new mongoose.Schema(
    {
        name: String,
        subject: String,
        content: String,
        brandId: mongoose.Schema.Types.ObjectId,
        userId: mongoose.Schema.Types.ObjectId,
        fromName: String,
        fromEmail: String,
        replyTo: String,
        status: {
            type: String,
            enum: ['draft', 'queued', 'scheduled', 'sending', 'sent', 'failed', 'paused'],
            default: 'draft',
        },
        contactListIds: [mongoose.Schema.Types.ObjectId],
        scheduleType: String,
        scheduledAt: Date,
        sentAt: Date,
        stats: {
            recipients: { type: Number, default: 0 },
            opens: { type: Number, default: 0 },
            clicks: { type: Number, default: 0 },
            bounces: { type: Number, default: 0 },
            complaints: { type: Number, default: 0 },
            processed: { type: Number, default: 0 },
        },
        processingMetadata: {
            lastProcessedContactIndex: { type: Number, default: 0 },
            lastProcessedListIndex: { type: Number, default: 0 },
            hasMoreToProcess: { type: Boolean, default: true },
            processingStartedAt: Date,
            processedBatches: { type: Number, default: 0 },
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        collection: 'campaigns', // Explicitly specify collection name
    }
);

const ContactSchema = new mongoose.Schema(
    {
        email: String,
        firstName: String,
        lastName: String,
        phone: String,
        listId: mongoose.Schema.Types.ObjectId,
        brandId: mongoose.Schema.Types.ObjectId,
        userId: mongoose.Schema.Types.ObjectId,
        status: {
            type: String,
            default: 'active',
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        collection: 'contacts', // Explicitly specify collection name
    }
);

const BrandSchema = new mongoose.Schema(
    {
        name: String,
        website: String,
        userId: mongoose.Schema.Types.ObjectId,
        awsRegion: String,
        awsAccessKey: String,
        awsSecretKey: String,
        sendingDomain: String,
        fromName: String,
        fromEmail: String,
        replyToEmail: String,
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending_setup', 'pending_verification'],
            default: 'pending_setup',
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        collection: 'brands', // Explicitly specify collection name
    }
);

// Create models
let Campaign, Contact, Brand;

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Initialize models
        Campaign = mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
        Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
        Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
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

// Process campaigns from the scheduler queue (scheduled for future)
schedulerQueue.process('process-scheduled-campaign', async (job) => {
    try {
        const { campaignId, brandId, userId, contactListIds, fromName, fromEmail, replyTo, subject } = job.data;
        console.log(`Processing scheduled campaign ${campaignId}`);

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

// Complete send-campaign handler for email-processor.js
emailCampaignQueue.process('send-campaign', async (job) => {
    const { campaignId, brandId, userId, contactListIds, fromName, fromEmail, replyTo, subject, brandAwsRegion, brandAwsAccessKey, brandAwsSecretKey } = job.data;

    try {
        console.log(`Starting to process campaign: ${campaignId}`);

        // Get campaign details
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            throw new Error(`Campaign not found: ${campaignId}`);
        }

        job.progress(5);

        // Update status to sending and initialize processing metadata
        campaign.status = 'sending';
        campaign.processingMetadata = {
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

        // Check quota and verify connection
        try {
            const quotaResponse = await ses.getSendQuota().promise();

            // Calculate remaining quota
            const remainingQuota = quotaResponse.Max24HourSend - quotaResponse.SentLast24Hours;
            console.log(`SES Quota - Max: ${quotaResponse.Max24HourSend}, Used: ${quotaResponse.SentLast24Hours}, Remaining: ${remainingQuota}`);

            // Get an estimate of contacts to be processed
            let totalContactsEstimate = 0;
            for (const listId of contactListIds) {
                const count = await Contact.countDocuments({
                    listId: listId,
                });
                totalContactsEstimate += count;
            }

            if (totalContactsEstimate > remainingQuota) {
                console.warn(`Campaign has ${totalContactsEstimate} contacts but only ${remainingQuota} remaining in quota`);
            }

            // Store the max send rate for rate limiting
            const maxSendRate = quotaResponse.MaxSendRate || 10; // Default SES rate limit is 10/sec

            job.progress(20);

            // Calculate optimal batch size based on SES send rate
            const BATCH_SIZE = Math.max(10, Math.min(100, maxSendRate * 2)); // 2x the sending rate, min 10, max 100
            console.log(`Using batch size of ${BATCH_SIZE} emails per batch`);

            // Process each contact list
            for (let listIndex = 0; listIndex < contactListIds.length; listIndex++) {
                const listId = contactListIds[listIndex];

                // Skip already processed lists based on metadata
                if (listIndex < campaign.processingMetadata.lastProcessedListIndex) {
                    console.log(`Skipping list ${listId} (already processed)`);
                    continue;
                }

                // Get contacts from this list
                const totalContacts = await Contact.countDocuments({
                    listId: listId,
                });

                console.log(`Processing list ${listId} with ${totalContacts} contacts`);

                // Process in chunks to avoid loading all contacts into memory
                const CHUNK_SIZE = 1000; // Process 1000 contacts at a time from DB
                let startIndex = 0;

                // If this is the list we were processing before, start from lastProcessedContactIndex
                if (listIndex === campaign.processingMetadata.lastProcessedListIndex) {
                    startIndex = campaign.processingMetadata.lastProcessedContactIndex;
                }

                while (startIndex < totalContacts) {
                    // Load a chunk of contacts
                    const contacts = await Contact.find({
                        listId: listId,
                    })
                        .sort({ _id: 1 }) // Ensure consistent ordering
                        .skip(startIndex)
                        .limit(CHUNK_SIZE);

                    if (contacts.length === 0) break;

                    // Process contacts in batches
                    for (let batchStart = 0; batchStart < contacts.length; batchStart += BATCH_SIZE) {
                        const batchContacts = contacts.slice(batchStart, batchStart + BATCH_SIZE);

                        // Update campaign metadata before processing the batch
                        campaign.processingMetadata.lastProcessedListIndex = listIndex;
                        campaign.processingMetadata.lastProcessedContactIndex = startIndex + batchStart;
                        await campaign.save();

                        // Create a rate limiter for this batch
                        const limiter = new RateLimiter({ tokensPerInterval: maxSendRate, interval: 'second' });

                        let successCount = 0;
                        let failureCount = 0;

                        // Process each contact in batch
                        for (const contact of batchContacts) {
                            // Wait for rate limiter token
                            await limiter.removeTokens(1);

                            try {
                                // Send the email to this contact
                                const result = await ses
                                    .sendEmail({
                                        Source: `${fromName} <${fromEmail}>`,
                                        Destination: {
                                            ToAddresses: [contact.firstName ? `${contact.firstName} ${contact.lastName || ''} <${contact.email}>`.trim() : contact.email],
                                        },
                                        Message: {
                                            Subject: {
                                                Data: subject || campaign.subject,
                                            },
                                            Body: {
                                                Html: {
                                                    Data: campaign.content || '<p>Empty campaign content</p>',
                                                },
                                                Text: {
                                                    Data: extractTextFromHtml(campaign.content) || 'Empty campaign content',
                                                },
                                            },
                                        },
                                        ReplyToAddresses: [replyTo || fromEmail],
                                    })
                                    .promise();

                                successCount++;
                            } catch (error) {
                                console.error(`Failed to send to ${contact.email}:`, error.message);
                                failureCount++;
                            }
                        }

                        // Update campaign stats for this batch
                        await Campaign.updateOne(
                            { _id: campaignId },
                            {
                                $inc: {
                                    'stats.processed': batchContacts.length,
                                    'stats.recipients': successCount,
                                    'stats.bounces': failureCount,
                                    'processingMetadata.processedBatches': 1,
                                },
                            }
                        );

                        // Report progress
                        const estimatedProgress = Math.min(95, 20 + (listIndex / contactListIds.length + (startIndex + batchStart + batchContacts.length) / totalContacts / contactListIds.length) * 80);

                        job.progress(Math.floor(estimatedProgress));
                    }

                    startIndex += CHUNK_SIZE;
                }

                // Update that we've completed this list
                campaign.processingMetadata.lastProcessedListIndex = listIndex + 1;
                campaign.processingMetadata.lastProcessedContactIndex = 0;
                await campaign.save();
            }

            job.progress(95);

            // Complete the campaign
            campaign.status = 'sent';
            campaign.sentAt = new Date();
            campaign.processingMetadata.hasMoreToProcess = false;
            await campaign.save();

            job.progress(100);

            console.log(`Campaign ${campaignId} completed successfully`);

            return {
                campaignId,
                status: 'completed',
                totalContacts: totalContactsEstimate,
                processed: campaign.stats.processed,
                sent: campaign.stats.recipients,
                failed: campaign.stats.bounces,
            };
        } catch (quotaError) {
            console.error('Error with SES service:', quotaError);
            throw new Error(`AWS SES error: ${quotaError.message}`);
        }
    } catch (error) {
        console.error(`Error processing campaign ${campaignId}:`, error);

        // Update campaign status to failed
        if (campaignId) {
            try {
                const campaign = await Campaign.findById(campaignId);
                if (campaign) {
                    campaign.status = 'failed';
                    campaign.processingMetadata = campaign.processingMetadata || {};
                    campaign.processingMetadata.hasMoreToProcess = true; // Mark that it can be resumed
                    await campaign.save();
                }
            } catch (updateError) {
                console.error('Error updating campaign status to failed:', updateError);
            }
        }

        throw error;
    }
});

// Extract plain text from HTML for text alternatives
function extractTextFromHtml(html) {
    if (!html) return '';

    // Simple implementation - in production you might want a better HTML-to-text converter
    return html
        .replace(/<style[^>]*>.*?<\/style>/gs, '')
        .replace(/<script[^>]*>.*?<\/script>/gs, '')
        .replace(/<[^>]*>/gs, '')
        .replace(/\s+/g, ' ')
        .trim();
}

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

// Add a cleanup routine that runs periodically
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

// Add this at the bottom of the file
setInterval(cleanupOldJobs, 24 * 60 * 60 * 1000); // Run once a day

// Start worker
connectDB()
    .then(() => {
        console.log('Email campaign worker started and ready to process jobs');
    })
    .catch((error) => {
        console.error('Failed to start worker:', error);
        process.exit(1);
    });
