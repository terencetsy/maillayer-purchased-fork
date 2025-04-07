import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Connect to database
        await connectToDatabase();

        // Find a user with this token and where the token hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        return res.status(200).json({ message: 'Token is valid' });
    } catch (error) {
        console.error('Verify reset token error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
