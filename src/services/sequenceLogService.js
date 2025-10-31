// src/services/sequenceLogService.js
import connectToDatabase from '@/lib/mongodb';
import { createSequenceLogModel } from '@/models/SequenceLog';
import EmailSequence from '@/models/EmailSequence';
import mongoose from 'mongoose';

export async function logSequenceEmail(logData) {
    await connectToDatabase();

    try {
        const SequenceLogModel = createSequenceLogModel(logData.sequenceId);

        const log = new SequenceLogModel({
            ...logData,
            createdAt: new Date(),
        });

        await log.save();

        console.log(`Created sequence log for ${logData.email} in collection seq_logs_${logData.sequenceId}`);

        return log;
    } catch (error) {
        console.error('Error logging sequence email:', error);
        throw error;
    }
}

export async function getSequenceLogs(sequenceId, options = {}) {
    await connectToDatabase();

    try {
        const { page = 1, limit = 50, email = '', status = '', startDate = null, endDate = null } = options;

        const SequenceLogModel = createSequenceLogModel(sequenceId);

        const query = {
            sequenceId: new mongoose.Types.ObjectId(sequenceId),
        };

        // Add email filter if provided
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }

        // Add status filter if provided
        if (status) {
            query.status = status;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            query.sentAt = {};
            if (startDate) {
                query.sentAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.sentAt.$lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;

        const logs = await SequenceLogModel.find(query).sort({ sentAt: -1 }).skip(skip).limit(limit).lean();

        const total = await SequenceLogModel.countDocuments(query);

        // Get status counts
        const statusCounts = await SequenceLogModel.aggregate([
            {
                $match: {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                },
            },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { _id: 0, status: '$_id', count: 1 } },
        ]);

        const statusCountsObj = {};
        statusCounts.forEach((item) => {
            statusCountsObj[item.status] = item.count;
        });

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            statusCounts: statusCountsObj,
        };
    } catch (error) {
        console.error('Error fetching sequence logs:', error);
        throw error;
    }
}

export async function getSequenceStats(sequenceId) {
    await connectToDatabase();

    try {
        const SequenceLogModel = createSequenceLogModel(sequenceId);

        // Get total sent count
        const sentCount = await SequenceLogModel.countDocuments({
            sequenceId: new mongoose.Types.ObjectId(sequenceId),
        });

        // Get total delivered count
        const deliveredCount = await SequenceLogModel.countDocuments({
            sequenceId: new mongoose.Types.ObjectId(sequenceId),
            status: 'delivered',
        });

        // Get open count from events
        const openCount = await SequenceLogModel.aggregate([
            {
                $match: {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'open'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        // Get click count from events
        const clickCount = await SequenceLogModel.aggregate([
            {
                $match: {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'click'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        // Get bounce count
        const bounceCount = await SequenceLogModel.countDocuments({
            sequenceId: new mongoose.Types.ObjectId(sequenceId),
            status: 'failed',
            error: { $regex: 'bounce', $options: 'i' },
        });

        // Get complaint count from events
        const complaintCount = await SequenceLogModel.aggregate([
            {
                $match: {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                },
            },
            {
                $project: {
                    events: {
                        $filter: {
                            input: '$events',
                            as: 'event',
                            cond: { $eq: ['$$event.type', 'complaint'] },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: { $size: '$events' } },
                },
            },
        ]);

        const opens = openCount.length > 0 ? openCount[0].count : 0;
        const clicks = clickCount.length > 0 ? clickCount[0].count : 0;
        const bounces = bounceCount || 0;
        const complaints = complaintCount.length > 0 ? complaintCount[0].count : 0;

        const openRate = sentCount > 0 ? ((opens / sentCount) * 100).toFixed(1) : 0;
        const clickRate = sentCount > 0 ? ((clicks / sentCount) * 100).toFixed(1) : 0;
        const bounceRate = sentCount > 0 ? ((bounces / sentCount) * 100).toFixed(1) : 0;
        const complaintRate = sentCount > 0 ? ((complaints / sentCount) * 100).toFixed(1) : 0;

        return {
            sent: sentCount,
            delivered: deliveredCount,
            opens,
            clicks,
            bounces,
            complaints,
            openRate,
            clickRate,
            bounceRate,
            complaintRate,
        };
    } catch (error) {
        console.error('Error getting sequence stats:', error);
        return {
            sent: 0,
            delivered: 0,
            opens: 0,
            clicks: 0,
            bounces: 0,
            complaints: 0,
            openRate: '0',
            clickRate: '0',
            bounceRate: '0',
            complaintRate: '0',
        };
    }
}

export async function trackSequenceEvent(sequenceId, enrollmentId, eventType, metadata = {}) {
    await connectToDatabase();

    try {
        const SequenceLogModel = createSequenceLogModel(sequenceId);

        // Find the log entry and check if event already exists
        const existingLog = await SequenceLogModel.findOne({
            sequenceId: new mongoose.Types.ObjectId(sequenceId),
            enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
            'events.type': eventType,
        });

        let logResult;

        if (existingLog) {
            // Update existing event
            logResult = await SequenceLogModel.findOneAndUpdate(
                {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                    enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
                    'events.type': eventType,
                },
                {
                    $set: {
                        'events.$.timestamp': new Date(),
                        'events.$.metadata': metadata,
                    },
                }
            );
        } else {
            // Add new event
            logResult = await SequenceLogModel.findOneAndUpdate(
                {
                    sequenceId: new mongoose.Types.ObjectId(sequenceId),
                    enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
                },
                {
                    $push: {
                        events: {
                            type: eventType,
                            timestamp: new Date(),
                            metadata,
                        },
                    },
                }
            );
        }

        return true;
    } catch (error) {
        console.error('Error tracking sequence event:', error);
        return false;
    }
}
