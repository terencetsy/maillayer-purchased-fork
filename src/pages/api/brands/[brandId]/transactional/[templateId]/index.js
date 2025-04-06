import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import connectToDatabase from '@/lib/mongodb';
import { getBrandById } from '@/services/brandService';
import { getTemplateById, updateTemplate, deleteTemplate, parseTemplateVariables } from '@/services/transactionalService';

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
        const { brandId, templateId } = req.query;

        if (!brandId || !templateId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check if the brand belongs to the user
        const brand = await getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (brand.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this brand' });
        }

        // GET request - get a specific template
        if (req.method === 'GET') {
            try {
                const template = await getTemplateById(templateId, userId);

                if (!template) {
                    return res.status(404).json({ message: 'Template not found' });
                }

                if (template.brandId.toString() !== brandId) {
                    return res.status(403).json({ message: 'Template does not belong to this brand' });
                }

                return res.status(200).json(template);
            } catch (error) {
                console.error('Error fetching template:', error);
                return res.status(500).json({ message: 'Error fetching template' });
            }
        }

        // PUT request - update a template
        if (req.method === 'PUT') {
            try {
                const { name, subject, content, fromName, fromEmail, replyTo, status, variables } = req.body;

                const template = await getTemplateById(templateId, userId);

                if (!template) {
                    return res.status(404).json({ message: 'Template not found' });
                }

                if (template.brandId.toString() !== brandId) {
                    return res.status(403).json({ message: 'Template does not belong to this brand' });
                }

                const updateData = {};

                if (name) updateData.name = name;
                if (subject) updateData.subject = subject;
                if (content !== undefined) updateData.content = content;
                if (fromName) updateData.fromName = fromName;
                if (fromEmail) updateData.fromEmail = fromEmail;
                if (replyTo) updateData.replyTo = replyTo;
                if (status) updateData.status = status;

                // Update variables based on content
                if (content && (!variables || variables.length === 0)) {
                    updateData.variables = await parseTemplateVariables(content);
                } else if (variables) {
                    updateData.variables = variables;
                }

                const success = await updateTemplate(templateId, userId, updateData);

                if (success) {
                    return res.status(200).json({ message: 'Template updated successfully' });
                } else {
                    return res.status(500).json({ message: 'Failed to update template' });
                }
            } catch (error) {
                console.error('Error updating template:', error);
                return res.status(500).json({ message: 'Error updating template' });
            }
        }

        // DELETE request - delete a template
        if (req.method === 'DELETE') {
            try {
                const template = await getTemplateById(templateId, userId);

                if (!template) {
                    return res.status(404).json({ message: 'Template not found' });
                }

                if (template.brandId.toString() !== brandId) {
                    return res.status(403).json({ message: 'Template does not belong to this brand' });
                }

                const success = await deleteTemplate(templateId, userId);

                if (success) {
                    return res.status(200).json({ message: 'Template deleted successfully' });
                } else {
                    return res.status(500).json({ message: 'Failed to delete template' });
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                return res.status(500).json({ message: 'Error deleting template' });
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
