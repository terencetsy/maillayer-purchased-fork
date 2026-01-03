import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import User from '@/models/User';

// Create a new team member invitation
export async function createTeamMemberInvite({ brandId, email, role, invitedBy }) {
    await connectToDatabase();

    // Generate invite token (same pattern as forgot-password.js)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const teamMember = new TeamMember({
        brandId,
        email,
        role,
        invitedBy,
        inviteToken,
        inviteTokenExpires,
        status: 'pending',
    });

    await teamMember.save();
    return { teamMember, inviteToken };
}

// Get all team members for a brand
export async function getTeamMembersByBrandId(brandId) {
    await connectToDatabase();
    return TeamMember.find({
        brandId,
        status: { $ne: 'revoked' },
    })
        .populate('userId', 'name email')
        .populate('invitedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
}

// Get team member by ID
export async function getTeamMemberById(teamMemberId) {
    await connectToDatabase();
    return TeamMember.findById(teamMemberId).lean();
}

// Get team member by invite token
export async function getTeamMemberByToken(inviteToken) {
    await connectToDatabase();
    return TeamMember.findOne({
        inviteToken,
        inviteTokenExpires: { $gt: Date.now() },
        status: 'pending',
    })
        .select('+inviteToken')
        .populate('brandId', 'name')
        .lean();
}

// Accept invitation (existing user)
export async function acceptInvitation(inviteToken, userId) {
    await connectToDatabase();

    const result = await TeamMember.updateOne(
        {
            inviteToken,
            inviteTokenExpires: { $gt: Date.now() },
            status: 'pending',
        },
        {
            $set: {
                userId,
                status: 'active',
                acceptedAt: new Date(),
            },
            $unset: {
                inviteToken: 1,
                inviteTokenExpires: 1,
            },
        }
    );

    return result.modifiedCount > 0;
}

// Accept invitation (new user - creates user account)
export async function acceptInvitationNewUser(inviteToken, { name, password }) {
    await connectToDatabase();

    // Find the invitation
    const invitation = await TeamMember.findOne({
        inviteToken,
        inviteTokenExpires: { $gt: Date.now() },
        status: 'pending',
    }).select('+inviteToken');

    if (!invitation) {
        return null;
    }

    // Create new user
    const user = new User({
        name,
        email: invitation.email,
        password, // Will be hashed by pre-save hook
        role: 'user',
    });

    await user.save();

    // Update invitation
    invitation.userId = user._id;
    invitation.status = 'active';
    invitation.acceptedAt = new Date();
    invitation.inviteToken = undefined;
    invitation.inviteTokenExpires = undefined;

    await invitation.save();

    return { user, invitation };
}

// Update team member role
export async function updateTeamMemberRole(teamMemberId, role) {
    await connectToDatabase();

    const result = await TeamMember.updateOne({ _id: teamMemberId }, { $set: { role, updatedAt: new Date() } });

    return result.modifiedCount > 0;
}

// Remove team member (revoke access)
export async function revokeTeamMember(teamMemberId) {
    await connectToDatabase();

    const result = await TeamMember.updateOne(
        { _id: teamMemberId },
        { $set: { status: 'revoked', updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
}

// Check if user has access to brand (as team member)
export async function checkBrandAccess(brandId, userId) {
    await connectToDatabase();

    const teamMember = await TeamMember.findOne({
        brandId,
        userId,
        status: 'active',
    }).lean();

    return teamMember;
}

// Get all brands a user has access to (as team member)
export async function getBrandsAsTeamMember(userId) {
    await connectToDatabase();

    return TeamMember.find({
        userId,
        status: 'active',
    })
        .populate('brandId')
        .lean();
}

// Regenerate invite token for pending invitation
export async function regenerateInviteToken(teamMemberId) {
    await connectToDatabase();

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const result = await TeamMember.updateOne(
        { _id: teamMemberId, status: 'pending' },
        {
            $set: {
                inviteToken,
                inviteTokenExpires,
                updatedAt: new Date(),
            },
        }
    );

    if (result.modifiedCount > 0) {
        return inviteToken;
    }
    return null;
}
