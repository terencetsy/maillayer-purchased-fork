import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById, updateBrand } from '@/services/brandService';
import AWS from 'aws-sdk';
import { checkBrandPermission, PERMISSIONS } from '@/lib/authorization';

export default async function handler(req, res) {
    try {
        // This endpoint only supports POST requests
        if (req.method !== 'POST') {
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
        const { brandId } = req.query;

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId, true);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check permission - email verification is an edit settings operation
        const authCheck = await checkBrandPermission(brandId, userId, PERMISSIONS.EDIT_SETTINGS);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ message: authCheck.message });
        }

        // Make sure AWS credentials are set up first
        if (!brand.awsRegion || !brand.awsAccessKey || !brand.awsSecretKey) {
            return res.status(400).json({ message: 'AWS credentials not set up. Please complete Step 1 first.' });
        }

        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        // Initialize AWS SES client
        const ses = new AWS.SES({
            region: brand.awsRegion,
            accessKeyId: brand.awsAccessKey,
            secretAccessKey: brand.awsSecretKey,
        });

        try {
            // Send verification email
            await ses
                .verifyEmailIdentity({
                    EmailAddress: email,
                })
                .promise();

            // Update fromEmail in brand
            await updateBrand(brandId, { fromEmail: email });

            return res.status(200).json({
                message: 'Verification email sent successfully',
                email,
            });
        } catch (error) {
            console.error('Error sending verification email:', error);
            return res.status(400).json({
                message: 'Failed to send verification email',
                error: error.message,
            });
        }
    } catch (error) {
        console.error('Error in verify-email endpoint:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
