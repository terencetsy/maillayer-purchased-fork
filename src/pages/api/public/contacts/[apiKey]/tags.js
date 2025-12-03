// src/pages/api/public/contacts/[apiKey]/tags.js
// This allows external systems (like your app) to update tags via API

import connectToDatabase from '@/lib/mongodb';
import ContactList from '@/models/ContactList';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const { apiKey } = req.query;
        const { email, tags, action = 'add' } = req.body;

        if (!apiKey) {
            return res.status(400).json({ success: false, message: 'API key required' });
        }

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email required' });
        }

        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({ success: false, message: 'Tags array required' });
        }

        // Find the contact list by API key
        const contactList = await ContactList.findOne({ apiKey, apiEnabled: true });

        if (!contactList) {
            return res.status(401).json({ success: false, message: 'Invalid or disabled API key' });
        }

        // Check domain if restrictions are set
        const origin = req.headers.origin || req.headers.referer;
        if (contactList.allowedDomains && contactList.allowedDomains.length > 0 && origin) {
            const originDomain = new URL(origin).hostname;
            const isAllowed = contactList.allowedDomains.some((d) => originDomain === d || originDomain.endsWith(`.${d}`));
            if (!isAllowed) {
                return res.status(403).json({ success: false, message: 'Domain not allowed' });
            }
        }

        const normalizedTags = tags.map((t) => t.toLowerCase().trim());

        // Find and update the contact
        let updateOperation;
        if (action === 'add') {
            updateOperation = { $addToSet: { tags: { $each: normalizedTags } } };
        } else if (action === 'remove') {
            updateOperation = { $pullAll: { tags: normalizedTags } };
        } else if (action === 'set') {
            updateOperation = { $set: { tags: normalizedTags } };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        const contact = await Contact.findOneAndUpdate(
            {
                email: email.toLowerCase(),
                brandId: contactList.brandId,
            },
            updateOperation,
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tags updated successfully',
            contactId: contact._id,
            tags: contact.tags,
        });
    } catch (error) {
        console.error('Error updating contact tags:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
