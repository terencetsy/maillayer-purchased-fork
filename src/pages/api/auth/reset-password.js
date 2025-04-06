import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
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

        // Update the user's password
        user.password = password; // The UserSchema pre-save hook will hash this
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
