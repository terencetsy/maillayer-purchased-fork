import connectToDatabase from '@/lib/mongodb';
import ContactList from '@/models/ContactList';
import Contact from '@/models/Contact';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST.',
        });
    }

    try {
        await connectToDatabase();

        const { apiKey } = req.query;
        const { email, firstName, lastName, phone } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Find the contact list by API key
        const contactList = await ContactList.findOne({
            apiKey,
            apiEnabled: true,
        });

        if (!contactList) {
            return res.status(404).json({
                success: false,
                message: 'Invalid API key or API is disabled',
            });
        }

        // Check allowed domains (origin/referer validation)
        if (contactList.allowedDomains && contactList.allowedDomains.length > 0) {
            const origin = req.headers.origin || req.headers.referer || '';

            // Extract domain from origin/referer
            let requestDomain = '';
            try {
                const url = new URL(origin);
                requestDomain = url.hostname;
            } catch (e) {
                // If we can't parse the URL, check if it's a direct API call
                // Allow localhost for testing
                if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Requests from this domain are not allowed',
                    });
                }
            }

            // Check if domain is in allowed list
            const isAllowed = contactList.allowedDomains.some((domain) => {
                // Remove protocol and trailing slashes
                const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
                return requestDomain.includes(cleanDomain) || cleanDomain.includes(requestDomain);
            });

            if (!isAllowed && requestDomain && !requestDomain.includes('localhost')) {
                return res.status(403).json({
                    success: false,
                    message: 'Requests from this domain are not allowed',
                });
            }
        }

        // Check if contact already exists
        const existingContact = await Contact.findOne({
            email: email.toLowerCase().trim(),
            listId: contactList._id,
        });

        if (existingContact) {
            if (!contactList.apiSettings?.allowDuplicates) {
                return res.status(200).json({
                    success: true,
                    message: 'Contact already exists in this list',
                    contactId: existingContact._id,
                    duplicate: true,
                });
            }
        }

        // Create new contact
        const contact = new Contact({
            email: email.toLowerCase().trim(),
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            listId: contactList._id,
            brandId: contactList.brandId,
            userId: contactList.userId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await contact.save();

        // Update contact count in the list
        await ContactList.updateOne(
            { _id: contactList._id },
            {
                $inc: { contactCount: 1 },
                updatedAt: new Date(),
            }
        );

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'Contact added successfully',
            contactId: contact._id,
            redirectUrl: contactList.apiSettings?.redirectUrl || null,
        });
    } catch (error) {
        console.error('Error adding contact via API:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(200).json({
                success: true,
                message: 'Contact already exists in this list',
                duplicate: true,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to add contact. Please try again.',
        });
    }
}
