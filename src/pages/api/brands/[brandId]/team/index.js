import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { createTeamMemberInvite, getTeamMembersByBrandId } from '@/services/teamMemberService';
import config from '@/lib/config';

export default async function handler(req, res) {
    try {
        await connectToDatabase();

        const session = await getServerSession(req, res, authOptions);
        if (!session?.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = session.user.id;
        const { brandId } = req.query;

        // Get brand and verify ownership (only owner can manage team)
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Only brand owner can manage team' });
        }

        // GET - List team members
        if (req.method === 'GET') {
            const teamMembers = await getTeamMembersByBrandId(brandId);
            return res.status(200).json(teamMembers);
        }

        // POST - Create invitation
        if (req.method === 'POST') {
            const { email, role } = req.body;

            if (!email || !role) {
                return res.status(400).json({ message: 'Email and role are required' });
            }

            if (!['editor', 'viewer'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }

            // Check if email is brand owner
            if (email.toLowerCase() === session.user.email.toLowerCase()) {
                return res.status(400).json({ message: 'Cannot invite yourself' });
            }

            try {
                const { teamMember, inviteToken } = await createTeamMemberInvite({
                    brandId,
                    email,
                    role,
                    invitedBy: userId,
                });

                // Generate invite URL
                const inviteUrl = `${config.baseUrl}/invite/${inviteToken}`;

                return res.status(201).json({
                    teamMember: {
                        _id: teamMember._id,
                        email: teamMember.email,
                        role: teamMember.role,
                        status: teamMember.status,
                        invitedAt: teamMember.invitedAt,
                    },
                    inviteUrl,
                });
            } catch (error) {
                if (error.code === 11000) {
                    return res.status(400).json({
                        message: 'This email has already been invited to this brand',
                    });
                }
                throw error;
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Team API error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
