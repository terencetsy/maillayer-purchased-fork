// src/pages/api/webhooks/ses-notifications.js
import connectToDatabase from '@/lib/mongodb';
import { createTrackingModel } from '@/models/TrackingEvent';
import Contact from '@/models/Contact';
import Campaign from '@/models/Campaign';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Connect to database
        await connectToDatabase();

        // Parse the SNS message
        const snsMessage = JSON.parse(req.body);

        // Log basic information about the message
        console.log('Received SNS message type:', snsMessage.Type);

        // Handle subscription confirmation
        if (snsMessage.Type === 'SubscriptionConfirmation') {
            const subscribeUrl = snsMessage.SubscribeURL;
            const response = await fetch(subscribeUrl);

            if (response.ok) {
                console.log('SNS subscription confirmed');
                return res.status(200).json({ message: 'Subscription confirmed' });
            } else {
                console.error('Failed to confirm SNS subscription');
                return res.status(500).json({ message: 'Failed to confirm subscription' });
            }
        }

        // Handle notification messages
        if (snsMessage.Type === 'Notification') {
            console.log('Processing SNS notification, MessageId:', snsMessage.MessageId);
            let messageContent;

            try {
                messageContent = JSON.parse(snsMessage.Message);
            } catch (parseError) {
                console.error('Error parsing SNS message:', parseError);
                return res.status(200).json({ message: 'Notification received but could not be parsed' });
            }

            const mailData = messageContent.mail;

            if (!mailData) {
                console.log('No mail data in notification');
                return res.status(200).json({ message: 'Notification processed (no mail data)' });
            }

            // Log mail data structure for debugging
            console.log(
                'Mail data structure:',
                JSON.stringify({
                    messageId: mailData.messageId,
                    hasHeaders: !!mailData.headers,
                    hasCommonHeaders: !!mailData.commonHeaders,
                    hasTags: !!mailData.tags,
                    tagKeys: mailData.tags ? Object.keys(mailData.tags) : [],
                    destination: mailData.destination ? mailData.destination.slice(0, 1) : [],
                })
            );

            // Extract campaign ID and contact ID from message tags
            let campaignId, contactId;

            // Check for tags directly in the mail object (primary location)
            if (mailData.tags) {
                // Format: {tags: {campaignId: ['abc123'], contactId: ['def456']}}
                if (mailData.tags.campaignId && mailData.tags.campaignId.length > 0) {
                    campaignId = mailData.tags.campaignId[0];
                }
                if (mailData.tags.contactId && mailData.tags.contactId.length > 0) {
                    contactId = mailData.tags.contactId[0];
                }

                console.log('Found tags in mailData.tags:', { campaignId, contactId });
            }

            // If not found in tags, try looking in headers
            if (!campaignId || !contactId) {
                if (mailData.headers && Array.isArray(mailData.headers)) {
                    // Look through headers for X-SES-* headers that might contain our tags
                    for (const header of mailData.headers) {
                        if (header.name === 'X-Campaign-ID' && header.value) {
                            campaignId = header.value;
                        } else if (header.name === 'X-Contact-ID' && header.value) {
                            contactId = header.value;
                        } else if (header.name === 'X-SES-Tag-campaignId' && header.value) {
                            campaignId = header.value;
                        } else if (header.name === 'X-SES-Tag-contactId' && header.value) {
                            contactId = header.value;
                        }
                    }

                    if (campaignId || contactId) {
                        console.log('Found IDs in headers:', { campaignId, contactId });
                    }
                }
            }

            // Try to extract from message ID if still not found
            if (!campaignId) {
                const messageIdPattern = /campaign[-_]([a-f0-9]+)/i;

                // Check in the messageId
                if (mailData.messageId) {
                    const msgIdMatch = mailData.messageId.match(messageIdPattern);
                    if (msgIdMatch && msgIdMatch[1]) {
                        campaignId = msgIdMatch[1];
                        console.log('Extracted campaignId from messageId:', campaignId);
                    }
                }

                // Check if it's in the subject
                if (!campaignId && mailData.commonHeaders && mailData.commonHeaders.subject) {
                    const subjectMatch = mailData.commonHeaders.subject.match(messageIdPattern);
                    if (subjectMatch && subjectMatch[1]) {
                        campaignId = subjectMatch[1];
                        console.log('Extracted campaignId from subject:', campaignId);
                    }
                }
            }

            // If we found campaignId but not contactId, search for contact by email
            if (campaignId && !contactId && messageContent.notificationType === 'Bounce') {
                const recipient = messageContent.bounce.bouncedRecipients[0];
                if (recipient && recipient.emailAddress) {
                    try {
                        // Find contact by email
                        const contact = await Contact.findOne({ email: recipient.emailAddress });
                        if (contact) {
                            contactId = contact._id.toString();
                            console.log('Found contactId by email lookup:', contactId);
                        }
                    } catch (err) {
                        console.error('Error finding contact by email:', err);
                    }
                }
            } else if (campaignId && !contactId && messageContent.notificationType === 'Complaint') {
                const recipient = messageContent.complaint.complainedRecipients[0];
                if (recipient && recipient.emailAddress) {
                    try {
                        const contact = await Contact.findOne({ email: recipient.emailAddress });
                        if (contact) {
                            contactId = contact._id.toString();
                            console.log('Found contactId by email lookup:', contactId);
                        }
                    } catch (err) {
                        console.error('Error finding contact by email:', err);
                    }
                }
            }

            // Final check if we have both IDs
            if (!campaignId || !contactId) {
                console.warn(
                    'Missing campaignId or contactId in notification:',
                    JSON.stringify({
                        messageId: mailData.messageId,
                        source: mailData.source,
                        destination: mailData.destination,
                        foundCampaignId: campaignId,
                        foundContactId: contactId,
                        notificationType: messageContent.notificationType,
                    })
                );
                return res.status(200).json({ message: 'Notification processed (missing IDs)' });
            }

            const notificationType = messageContent.notificationType;
            console.log(`Processing ${notificationType} notification for campaign ${campaignId}, contact ${contactId}`);

            if (notificationType === 'Bounce') {
                const bounceInfo = messageContent.bounce;
                const recipients = bounceInfo.bouncedRecipients;
                const bounceType = bounceInfo.bounceType; // Permanent or Transient
                const subType = bounceInfo.bounceSubType;

                console.log('Bounce received:', {
                    type: bounceType,
                    subType,
                    recipients: recipients.map((r) => r.emailAddress),
                    campaignId,
                    contactId,
                });

                // Only mark as unsubscribed for permanent bounces
                const isPermanent = bounceType === 'Permanent';

                if (isPermanent) {
                    // Update contact status directly using the contactId from tags
                    await Contact.findByIdAndUpdate(contactId, {
                        isUnsubscribed: true,
                        unsubscribedAt: new Date(),
                        unsubscribeReason: `Bounce: ${bounceType} - ${subType}`,
                        unsubscribedFromCampaign: campaignId,
                    });
                }

                // Record the bounce event
                const TrackingModel = createTrackingModel(campaignId);
                const recipient = recipients[0]; // Get the first recipient

                const trackingEvent = new TrackingModel({
                    contactId: new mongoose.Types.ObjectId(contactId),
                    campaignId: new mongoose.Types.ObjectId(campaignId),
                    email: recipient.emailAddress,
                    eventType: 'bounce',
                    timestamp: new Date(),
                    metadata: {
                        bounceType,
                        bounceSubType: subType,
                        diagnosticCode: recipient.diagnosticCode || '',
                    },
                });

                await trackingEvent.save();

                // Update campaign stats
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.bounces': 1 } });
            } else if (notificationType === 'Complaint') {
                const complaintInfo = messageContent.complaint;
                const recipients = complaintInfo.complainedRecipients;

                console.log('Complaint received:', {
                    recipients: recipients.map((r) => r.emailAddress),
                    campaignId,
                    contactId,
                });

                // Update contact directly using the contactId from tags
                await Contact.findByIdAndUpdate(contactId, {
                    isUnsubscribed: true,
                    unsubscribedAt: new Date(),
                    unsubscribeReason: 'Complaint',
                    unsubscribedFromCampaign: campaignId,
                });

                // Record the complaint event
                const TrackingModel = createTrackingModel(campaignId);
                const recipient = recipients[0]; // Get the first recipient

                const trackingEvent = new TrackingModel({
                    contactId: new mongoose.Types.ObjectId(contactId),
                    campaignId: new mongoose.Types.ObjectId(campaignId),
                    email: recipient.emailAddress,
                    eventType: 'complaint',
                    timestamp: new Date(),
                    metadata: {
                        complaintFeedbackType: complaintInfo.complaintFeedbackType || '',
                        userAgent: complaintInfo.userAgent || '',
                    },
                });

                await trackingEvent.save();

                // Update campaign stats
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.complaints': 1 } });
            } else if (notificationType === 'Delivery') {
                const deliveryInfo = messageContent.delivery;

                console.log('Delivery success:', {
                    email: mailData.destination[0],
                    campaignId,
                    contactId,
                });

                // Record the delivery event
                const TrackingModel = createTrackingModel(campaignId);

                const trackingEvent = new TrackingModel({
                    contactId: new mongoose.Types.ObjectId(contactId),
                    campaignId: new mongoose.Types.ObjectId(campaignId),
                    email: mailData.destination[0],
                    eventType: 'delivery',
                    timestamp: new Date(),
                    metadata: {
                        smtpResponse: deliveryInfo.smtpResponse || '',
                        reportingMTA: deliveryInfo.reportingMTA || '',
                    },
                });

                await trackingEvent.save();
            }

            return res.status(200).json({ message: 'Notification processed' });
        }

        return res.status(200).json({ message: 'Message received' });
    } catch (error) {
        console.error('Error processing SNS notification:', error);
        return res.status(500).json({ message: 'Error processing notification', error: error.message });
    }
}
