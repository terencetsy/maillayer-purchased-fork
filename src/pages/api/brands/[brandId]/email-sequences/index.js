// src/pages/api/brands/[brandId]/email-sequences/index.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getEmailSequencesByBrandId, createEmailSequence } from '@/services/emailSequenceService';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: 'Missing brand ID' });
        }

        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // GET - Fetch all email sequences
        if (req.method === 'GET') {
            const sequences = await getEmailSequencesByBrandId(brandId, userId);
            return res.status(200).json(sequences);
        }

        // POST - Create a new email sequence
        if (req.method === 'POST') {
            const { name, description, contactListIds, emails, status, triggerType, triggerConfig, emailConfig } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Name is required' });
            }

            // Allow draft sequences without emails
            if (status !== 'draft' && (!emails || emails.length === 0)) {
                return res.status(400).json({ message: 'At least one email is required for non-draft sequences' });
            }

            const sequence = await createEmailSequence({
                name,
                description: description || '',
                brandId,
                userId,
                status: status || 'draft',
                triggerType: triggerType || 'contact_list',
                triggerConfig: triggerConfig || {
                    contactListIds: contactListIds || [],
                },
                emailConfig: emailConfig || {
                    fromName: brand.fromName || '',
                    fromEmail: brand.fromEmail || '',
                    replyToEmail: brand.replyToEmail || '',
                },
                emails: emails || [],
            });

            return res.status(201).json(sequence);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error handling email sequences:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
