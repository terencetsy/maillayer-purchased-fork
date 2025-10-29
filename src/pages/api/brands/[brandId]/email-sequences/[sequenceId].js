// src/pages/api/brands/[brandId]/email-sequences/[sequenceId].js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getEmailSequenceById, updateEmailSequence, deleteEmailSequence } from '@/services/emailSequenceService';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, sequenceId } = req.query;

        if (!brandId || !sequenceId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // GET - Fetch sequence
        if (req.method === 'GET') {
            const sequence = await getEmailSequenceById(sequenceId, userId);

            if (!sequence) {
                return res.status(404).json({ message: 'Sequence not found' });
            }

            return res.status(200).json(sequence);
        }

        // PUT - Update sequence
        if (req.method === 'PUT') {
            const { name, description, contactListIds, emails, status } = req.body;

            const updateData = {};
            if (name) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (contactListIds) updateData.contactListIds = contactListIds;
            if (emails) updateData.emails = emails;
            if (status) updateData.status = status;

            const success = await updateEmailSequence(sequenceId, userId, updateData);

            if (!success) {
                return res.status(404).json({ message: 'Sequence not found' });
            }

            return res.status(200).json({ message: 'Sequence updated successfully' });
        }

        // DELETE - Delete sequence
        if (req.method === 'DELETE') {
            const success = await deleteEmailSequence(sequenceId, userId);

            if (!success) {
                return res.status(404).json({ message: 'Sequence not found' });
            }

            return res.status(200).json({ message: 'Sequence deleted successfully' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error handling email sequence:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
