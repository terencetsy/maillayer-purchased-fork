import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTeamMemberById, regenerateInviteToken } from '@/services/teamMemberService';
import config from '@/lib/config';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session?.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId, memberId } = req.query;

        // Verify brand ownership
        const brand = await getBrandById(brandId);
        if (!brand || brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Verify team member
        const teamMember = await getTeamMemberById(memberId);
        if (!teamMember || teamMember.brandId.toString() !== brandId) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        if (teamMember.status !== 'pending') {
            return res.status(400).json({
                message: 'Can only regenerate token for pending invitations',
            });
        }

        const newToken = await regenerateInviteToken(memberId);

        if (newToken) {
            const inviteUrl = `${config.baseUrl}/invite/${newToken}`;
            return res.status(200).json({ inviteUrl });
        }

        return res.status(500).json({ message: 'Failed to regenerate invite' });
    } catch (error) {
        console.error('Regenerate invite error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
