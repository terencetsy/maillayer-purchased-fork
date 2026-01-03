import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById, updateBrand, deleteBrand } from '@/services/brandService';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        // Connect to database
        await connectToDatabase();

        // Get session directly from server
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: 'Missing brand ID' });
        }

        // GET request - get brand details
        if (req.method === 'GET') {
            try {
                // Check permission (VIEW_BRAND allows owners and team members)
                const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.VIEW_BRAND);
                if (!authCheck.authorized) {
                    return res.status(authCheck.status).json({ message: authCheck.message });
                }

                const includeSecrets = req.query.includeSecrets === 'true';
                const brand = await getBrandById(brandId, includeSecrets);

                if (!brand) {
                    return res.status(404).json({ message: 'Brand not found' });
                }

                // Add user's role to the response
                return res.status(200).json({
                    ...brand,
                    userRole: authCheck.accessInfo.role,
                });
            } catch (error) {
                console.error('Error fetching brand:', error);
                return res.status(500).json({ message: 'Error fetching brand' });
            }
        }

        // PUT request - update brand
        if (req.method === 'PUT') {
            try {
                // Check permission (EDIT_SETTINGS required for updating brand)
                const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.EDIT_SETTINGS);
                if (!authCheck.authorized) {
                    return res.status(authCheck.status).json({ message: authCheck.message });
                }

                const { name, awsRegion, awsAccessKey, awsSecretKey, sendingDomain, fromName, fromEmail, replyToEmail, status } = req.body;

                const updateData = {};

                if (name) updateData.name = name;
                if (awsRegion) updateData.awsRegion = awsRegion;
                if (awsAccessKey) updateData.awsAccessKey = awsAccessKey;
                if (awsSecretKey) updateData.awsSecretKey = awsSecretKey;
                if (sendingDomain) updateData.sendingDomain = sendingDomain;
                if (fromName) updateData.fromName = fromName;
                if (fromEmail) updateData.fromEmail = fromEmail;
                if (replyToEmail) updateData.replyToEmail = replyToEmail;
                if (status) updateData.status = status;

                const success = await updateBrand(brandId, updateData);

                if (success) {
                    return res.status(200).json({ message: 'Brand updated successfully' });
                } else {
                    return res.status(500).json({ message: 'Failed to update brand' });
                }
            } catch (error) {
                console.error('Error updating brand:', error);
                return res.status(500).json({ message: 'Error updating brand' });
            }
        }

        // DELETE request - delete brand (owner only)
        if (req.method === 'DELETE') {
            try {
                // Check permission (DELETE_BRAND is owner-only)
                const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.DELETE_BRAND);
                if (!authCheck.authorized) {
                    return res.status(authCheck.status).json({ message: authCheck.message });
                }

                const success = await deleteBrand(brandId);

                if (success) {
                    return res.status(200).json({ message: 'Brand deleted successfully' });
                } else {
                    return res.status(500).json({ message: 'Failed to delete brand' });
                }
            } catch (error) {
                console.error('Error deleting brand:', error);
                return res.status(500).json({ message: 'Error deleting brand' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
