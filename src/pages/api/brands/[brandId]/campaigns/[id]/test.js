// src/pages/api/brands/[brandId]/campaigns/[id]/test.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getCampaignById } from '@/services/campaignService';
import { getBrandById } from '@/services/brandService';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import crypto from 'crypto';

// Utility function to decrypt AWS secret key
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

// Extract plain text from HTML
function extractTextFromHtml(html) {
    if (!html) return '';

    // Simple regex-based text extraction (you can use cheerio if needed)
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Connect to database
        await connectToDatabase();

        // Get session
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, id } = req.query;
        const { email, fromName, fromEmail, replyTo } = req.body;

        // Validate required parameters
        if (!brandId || !id) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId, true);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // Check if brand has SES credentials configured
        if (brand.status === 'pending_setup' || brand.status === 'pending_verification') {
            return res.status(400).json({ message: 'Brand email sending is not configured or verified' });
        }

        if (!brand.awsRegion || !brand.awsAccessKey || !brand.awsSecretKey) {
            return res.status(400).json({ message: 'AWS SES credentials not configured for this brand' });
        }

        // Get campaign
        const campaign = await getCampaignById(id, userId);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        if (campaign.brandId.toString() !== brandId) {
            return res.status(403).json({ message: 'Campaign does not belong to this brand' });
        }

        // Check if campaign has content
        if (!campaign.content || campaign.content.trim() === '') {
            return res.status(400).json({ message: 'Campaign has no content to send' });
        }

        // Create SES client
        const sesClient = new SESClient({
            region: brand.awsRegion || 'us-east-1',
            credentials: {
                accessKeyId: brand.awsAccessKey,
                secretAccessKey: decryptData(brand.awsSecretKey, process.env.ENCRYPTION_KEY),
            },
        });

        // Prepare email content (without tracking for test emails)
        const htmlContent = campaign.content;
        const textContent = extractTextFromHtml(htmlContent);

        // Add test email banner
        const testBanner = `
            <div style="background-color: #FFF3CD; border: 2px solid #FFC107; padding: 15px; margin-bottom: 20px; border-radius: 4px; text-align: center;">
                <strong style="color: #856404;">⚠️ TEST EMAIL</strong>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">This is a test send. Tracking links are not active.</p>
            </div>
        `;

        const finalHtmlContent = htmlContent.includes('<body') ? htmlContent.replace(/<body[^>]*>/i, `$&${testBanner}`) : `${testBanner}${htmlContent}`;

        // Send test email
        const sendCommand = new SendEmailCommand({
            Source: `${fromName || brand.fromName || brand.name} <${fromEmail || brand.fromEmail}>`,
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: `[TEST] ${campaign.subject}`,
                },
                Body: {
                    Html: {
                        Data: finalHtmlContent,
                    },
                    Text: {
                        Data: `TEST EMAIL\n\n${textContent}`,
                    },
                },
            },
            ReplyToAddresses: [replyTo || brand.replyToEmail || fromEmail || brand.fromEmail],
        });

        const result = await sesClient.send(sendCommand);

        console.log(`Test email sent for campaign ${id} to ${email}, MessageId: ${result.MessageId}`);

        return res.status(200).json({
            message: 'Test email sent successfully',
            messageId: result.MessageId,
            email: email,
        });
    } catch (error) {
        console.error('Error sending test email:', error);

        // Handle specific AWS SES errors
        if (error.name === 'MessageRejected') {
            return res.status(400).json({ message: 'Email was rejected by SES. Please check your sending domain verification.' });
        }

        if (error.name === 'InvalidParameterValue') {
            return res.status(400).json({ message: 'Invalid email parameters. Please check your configuration.' });
        }

        if (error.name === 'MailFromDomainNotVerifiedException') {
            return res.status(400).json({ message: 'Your sending domain is not verified in AWS SES.' });
        }

        return res.status(500).json({
            message: 'Failed to send test email',
            error: error.message,
        });
    }
}
