// src/pages/api/brands/[brandId]/email-sequences/[sequenceId]/logs.js
import { getSession } from 'next-auth/react';
import connectToDatabase from '@/lib/mongodb';
import EmailSequence from '@/models/EmailSequence';
import { getSequenceLogs } from '@/services/sequenceLogService';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        if (!session) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const userId = session.user.id;
        const { brandId, sequenceId } = req.query;

        // Parse pagination and filter parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const email = req.query.email || '';
        const status = req.query.status || '';
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;

        if (!brandId || !sequenceId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Get the sequence
        const sequence = await EmailSequence.findOne({
            _id: new mongoose.Types.ObjectId(sequenceId),
            brandId: new mongoose.Types.ObjectId(brandId),
            userId: new mongoose.Types.ObjectId(userId),
        });

        if (!sequence) {
            return res.status(404).json({ message: 'Sequence not found' });
        }

        // Get logs
        const result = await getSequenceLogs(sequenceId, {
            page,
            limit,
            email,
            status,
            startDate,
            endDate,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching sequence logs:', error);
        return res.status(500).json({
            message: 'Error fetching logs',
            error: error.message,
        });
    }
}
