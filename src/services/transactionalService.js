import connectToDatabase from '@/lib/mongodb';
import TransactionalTemplate from '@/models/TransactionalTemplate';
import TransactionalLog from '@/models/TransactionalLog';
import mongoose from 'mongoose';
import crypto from 'crypto';

export async function createTemplate(templateData) {
    await connectToDatabase();

    const template = new TransactionalTemplate({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await template.save();
    return template;
}

export async function getTemplatesByBrandId(brandId, userId) {
    await connectToDatabase();

    const templates = await TransactionalTemplate.find({
        brandId,
        userId,
    })
        .sort({ createdAt: -1 })
        .lean();

    return templates;
}

export async function getTemplateById(templateId, userId) {
    await connectToDatabase();

    const template = await TransactionalTemplate.findOne({
        _id: templateId,
        userId,
    }).lean();

    return template;
}

export async function getTemplateByApiKey(apiKey) {
    await connectToDatabase();

    const template = await TransactionalTemplate.findOne({
        apiKey,
        status: 'active',
    }).lean();

    return template;
}

export async function updateTemplate(templateId, userId, updateData) {
    await connectToDatabase();

    const result = await TransactionalTemplate.updateOne(
        { _id: templateId, userId },
        {
            $set: {
                ...updateData,
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount > 0;
}

export async function deleteTemplate(templateId, userId) {
    await connectToDatabase();

    const result = await TransactionalTemplate.deleteOne({ _id: templateId, userId });
    return result.deletedCount > 0;
}

export async function logTransactionalEmail(logData) {
    await connectToDatabase();

    const log = new TransactionalLog({
        ...logData,
        createdAt: new Date(),
    });

    await log.save();

    // Update template stats
    await TransactionalTemplate.updateOne({ _id: logData.templateId }, { $inc: { 'stats.sent': 1 } });

    return log;
}

export async function getTemplateStats(templateId) {
    await connectToDatabase();

    const template = await TransactionalTemplate.findById(templateId).lean();

    if (!template) {
        throw new Error('Template not found');
    }

    // Get additional stats from logs if needed
    const sentCount = await TransactionalLog.countDocuments({ templateId });
    const logs = await TransactionalLog.find({ templateId }).sort({ createdAt: -1 }).limit(10).lean();

    return {
        ...template.stats,
        sentCount,
        recentLogs: logs,
    };
}

export async function getTemplateLogs(templateId, options = {}) {
    await connectToDatabase();

    const { page = 1, limit = 50, email = '', status = '' } = options;

    const query = { templateId: new mongoose.Types.ObjectId(templateId) };

    // Add email filter if provided
    if (email) {
        query.to = { $regex: email, $options: 'i' };
    }

    // Add status filter if provided
    if (status) {
        query.status = status;
    }

    const skip = (page - 1) * limit;

    const logs = await TransactionalLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    const total = await TransactionalLog.countDocuments(query);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

export async function regenerateApiKey(templateId, userId) {
    await connectToDatabase();

    const newApiKey = `txn_${mongoose.Types.ObjectId().toString()}_${Date.now().toString(36)}`;

    const result = await TransactionalTemplate.updateOne(
        { _id: templateId, userId },
        {
            $set: {
                apiKey: newApiKey,
                updatedAt: new Date(),
            },
        }
    );

    if (result.modifiedCount > 0) {
        return newApiKey;
    }

    return null;
}

export async function parseTemplateVariables(content) {
    // Regular expression to match variables like [variable_name]
    const variableRegex = /\[([\w\d_]+)\]/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
        // Check if variable already exists in array
        if (!variables.some((v) => v.name === match[1])) {
            variables.push({
                name: match[1],
                description: `Variable for ${match[1]}`,
                required: false,
            });
        }
    }

    return variables;
}

export async function trackTransactionalEvent(templateId, eventType, metadata = {}) {
    await connectToDatabase();

    // Update template stats based on event type
    let updateField = '';
    switch (eventType) {
        case 'open':
            updateField = 'stats.opens';
            break;
        case 'click':
            updateField = 'stats.clicks';
            break;
        case 'bounce':
            updateField = 'stats.bounces';
            break;
        case 'complaint':
            updateField = 'stats.complaints';
            break;
        default:
            return false;
    }

    if (updateField) {
        await TransactionalTemplate.updateOne({ _id: templateId }, { $inc: { [updateField]: 1 } });
        return true;
    }

    return false;
}
