import connectToDatabase from '@/lib/mongodb';
import Integration from '@/models/Integration';
import mongoose from 'mongoose';

// Get all integrations for a brand
export async function getIntegrationsByBrandId(brandId, userId) {
    await connectToDatabase();

    const integrations = await Integration.find({
        brandId: new mongoose.Types.ObjectId(brandId),
        userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    return integrations;
}

// Get a specific integration
export async function getIntegrationById(integrationId, brandId, userId) {
    await connectToDatabase();

    const integration = await Integration.findOne({
        _id: new mongoose.Types.ObjectId(integrationId),
        brandId: new mongoose.Types.ObjectId(brandId),
        userId: new mongoose.Types.ObjectId(userId),
    });

    return integration;
}

// Get integration by type for a brand
export async function getIntegrationByType(type, brandId, userId) {
    await connectToDatabase();

    const integration = await Integration.findOne({
        type,
        brandId: new mongoose.Types.ObjectId(brandId),
        userId: new mongoose.Types.ObjectId(userId),
    });

    return integration;
}

// Create a new integration
export async function createIntegration(integrationData) {
    await connectToDatabase();

    const integration = new Integration({
        ...integrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await integration.save();
    return integration;
}

// Update an integration
export async function updateIntegration(integrationId, brandId, userId, updateData) {
    await connectToDatabase();

    const integration = await Integration.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(integrationId),
            brandId: new mongoose.Types.ObjectId(brandId),
            userId: new mongoose.Types.ObjectId(userId),
        },
        {
            ...updateData,
            updatedAt: new Date(),
        },
        { new: true }
    );

    return integration;
}

// Delete an integration
export async function deleteIntegration(integrationId, brandId, userId) {
    await connectToDatabase();

    const result = await Integration.deleteOne({
        _id: new mongoose.Types.ObjectId(integrationId),
        brandId: new mongoose.Types.ObjectId(brandId),
        userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
}
