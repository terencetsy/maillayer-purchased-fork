// src/pages/api/brands/[brandId]/contact-lists/[listId]/export.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getContactListById } from '@/services/contactService';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        // This endpoint only supports GET requests
        if (req.method !== 'GET') {
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
        const status = req.query.status || '';

        if (!brandId || !listId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if the brand exists
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_CONTACTS);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Get the contact list and check if it exists
        const contactList = await getContactListById(listId, brandId, userId);
        if (!contactList) {
            return res.status(404).json({ message: 'Contact list not found' });
        }

        // Build query to get contacts
        const query = {
            listId: new mongoose.Types.ObjectId(listId),
            brandId: new mongoose.Types.ObjectId(brandId),
            userId: new mongoose.Types.ObjectId(userId),
        };

        // Add status filter if provided
        if (status && status !== 'all') {
            query.status = status;
        }

        // Get all contacts in the list matching the query
        const contacts = await Contact.find(query).sort({ email: 1 });

        // Format contacts for CSV export (pick specific fields)
        const contactsForExport = contacts.map((contact) => ({
            email: contact.email,
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            phone: contact.phone || '',
            status: contact.status || 'active',
            createdAt: contact.createdAt ? new Date(contact.createdAt).toISOString().split('T')[0] : '',
            unsubscribedAt: contact.unsubscribedAt ? new Date(contact.unsubscribedAt).toISOString().split('T')[0] : '',
            unsubscribeReason: contact.unsubscribeReason || '',
            bouncedAt: contact.bouncedAt ? new Date(contact.bouncedAt).toISOString().split('T')[0] : '',
            bounceReason: contact.bounceReason || '',
            complainedAt: contact.complainedAt ? new Date(contact.complainedAt).toISOString().split('T')[0] : '',
        }));

        // Create CSV from contacts
        const json2csvParser = new Parser({
            fields: [
                { label: 'Email', value: 'email' },
                { label: 'First Name', value: 'firstName' },
                { label: 'Last Name', value: 'lastName' },
                { label: 'Phone', value: 'phone' },
                { label: 'Status', value: 'status' },
                { label: 'Created Date', value: 'createdAt' },
                { label: 'Unsubscribed Date', value: 'unsubscribedAt' },
                { label: 'Unsubscribe Reason', value: 'unsubscribeReason' },
                { label: 'Bounced Date', value: 'bouncedAt' },
                { label: 'Bounce Reason', value: 'bounceReason' },
                { label: 'Complained Date', value: 'complainedAt' },
            ],
        });

        const csv = json2csvParser.parse(contactsForExport);

        // Set filename based on status filter
        let filename = contactList.name;
        if (status) {
            filename += `-${status}`;
        }
        filename += `-contacts.csv`;

        // Set headers to download as CSV file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Send the CSV data
        res.status(200).send(csv);
    } catch (error) {
        console.error('Error exporting contacts:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
