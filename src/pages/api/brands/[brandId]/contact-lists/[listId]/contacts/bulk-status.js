// src/pages/api/brands/[brandId]/contact-lists/[listId]/contacts/bulk-status.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getContactListById } from '@/services/contactService';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    try {
        // This endpoint only supports PUT requests
        if (req.method !== 'PUT') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        // Connect to database
        await connectToDatabase();

        // Get session directly from server
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, listId } = req.query;
        const { contactIds, status, reason } = req.body;

        if (!brandId || !listId || !contactIds || !status || !Array.isArray(contactIds) || contactIds.length === 0) {
            return res.status(400).json({ message: 'Missing or invalid required parameters' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // Check if the list exists
        const contactList = await getContactListById(listId, brandId, userId);
        if (!contactList) {
            return res.status(404).json({ message: 'Contact list not found' });
        }

        // Validate status
        const validStatuses = ['active', 'unsubscribed', 'bounced', 'complained'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        // Prepare the update data
        const updateData = {
            status: status,
        };

        // Set additional fields based on status
        if (status === 'unsubscribed') {
            updateData.isUnsubscribed = true;
            updateData.unsubscribedAt = new Date();
            updateData.unsubscribeReason = reason || 'Bulk unsubscribe by admin';
        } else if (status === 'bounced') {
            updateData.isUnsubscribed = true;
            updateData.bouncedAt = new Date();
            updateData.bounceReason = reason || 'Manually marked as bounced';
            updateData.unsubscribedAt = new Date();
        } else if (status === 'complained') {
            updateData.isUnsubscribed = true;
            updateData.complainedAt = new Date();
            updateData.complaintReason = reason || 'Manually marked as complained';
            updateData.unsubscribedAt = new Date();
        } else if (status === 'active') {
            // Reset unsubscribed status
            updateData.isUnsubscribed = false;
            // We don't clear the timestamps to maintain historical record
        }

        // Convert contact IDs to ObjectIds
        const contactObjectIds = contactIds.map((id) => new mongoose.Types.ObjectId(id));

        // Update all selected contacts
        const result = await Contact.updateMany(
            {
                _id: { $in: contactObjectIds },
                listId: new mongoose.Types.ObjectId(listId),
                brandId: new mongoose.Types.ObjectId(brandId),
                userId: new mongoose.Types.ObjectId(userId),
            },
            { $set: updateData }
        );

        return res.status(200).json({
            message: 'Contacts status updated successfully',
            updated: result.modifiedCount,
            matched: result.matchedCount,
        });
    } catch (error) {
        console.error('Error updating contact statuses:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
