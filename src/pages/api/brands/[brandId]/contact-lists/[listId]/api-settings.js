import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getContactListById } from '@/services/contactService';
import ContactList from '@/models/ContactList';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, listId } = req.query;

        // Verify brand ownership
        const brand = await getBrandById(brandId);
        if (!brand || brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify list ownership
        const contactList = await getContactListById(listId, brandId, userId);
        if (!contactList) {
            return res.status(404).json({ message: 'Contact list not found' });
        }

        // GET - Get current API settings
        if (req.method === 'GET') {
            return res.status(200).json({
                apiKey: contactList.apiKey || null,
                apiEnabled: contactList.apiEnabled || false,
                allowedDomains: contactList.allowedDomains || [],
                apiSettings: contactList.apiSettings || {
                    requireDoubleOptIn: false,
                    allowDuplicates: false,
                    redirectUrl: '',
                },
            });
        }

        // POST - Generate new API key
        if (req.method === 'POST') {
            const newApiKey = `cl_${new mongoose.Types.ObjectId().toString()}_${Date.now().toString(36)}`;

            await ContactList.updateOne(
                { _id: new mongoose.Types.ObjectId(listId) },
                {
                    $set: {
                        apiKey: newApiKey,
                        apiEnabled: true,
                        updatedAt: new Date(),
                    },
                }
            );

            return res.status(200).json({
                success: true,
                apiKey: newApiKey,
                message: 'API key generated successfully',
            });
        }

        // PUT - Update API settings
        if (req.method === 'PUT') {
            const { apiEnabled, allowedDomains, apiSettings } = req.body;

            const updateData = {
                updatedAt: new Date(),
            };

            if (typeof apiEnabled === 'boolean') {
                updateData.apiEnabled = apiEnabled;
            }

            if (Array.isArray(allowedDomains)) {
                updateData.allowedDomains = allowedDomains.filter((d) => d.trim());
            }

            if (apiSettings) {
                updateData.apiSettings = {
                    requireDoubleOptIn: apiSettings.requireDoubleOptIn || false,
                    allowDuplicates: apiSettings.allowDuplicates || false,
                    redirectUrl: apiSettings.redirectUrl || '',
                };
            }

            await ContactList.updateOne({ _id: new mongoose.Types.ObjectId(listId) }, { $set: updateData });

            return res.status(200).json({
                success: true,
                message: 'API settings updated successfully',
            });
        }

        // DELETE - Disable API and remove key
        if (req.method === 'DELETE') {
            await ContactList.updateOne(
                { _id: new mongoose.Types.ObjectId(listId) },
                {
                    $set: {
                        apiEnabled: false,
                        updatedAt: new Date(),
                    },
                }
            );

            return res.status(200).json({
                success: true,
                message: 'API access disabled',
            });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Error managing API settings:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
