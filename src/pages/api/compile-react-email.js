// src/pages/api/compile-react-email.js
import { render } from '@react-email/render';
import * as ReactEmail from '@react-email/components';
import React from 'react';
import * as Babel from '@babel/standalone';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    try {
        // Strip import statements since we provide components as parameters
        // Also strip export statements to get just the function
        let cleanedCode = code
            // Remove multiline import statements (handles imports that span multiple lines)
            .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"].*?['"];?/g, '')
            // Remove single-line import statements
            .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
            .replace(/import\s+['"].*?['"];?/g, '')
            // Convert "export default function SomeName" to "function Email"
            .replace(/export\s+default\s+function\s+\w+/g, 'function Email')
            // Convert "export default function" (anonymous) to "function Email"
            .replace(/export\s+default\s+function/g, 'function Email')
            // Convert "export default" arrow function or variable
            .replace(/export\s+default\s+/g, 'var Email = ')
            .trim();

        // Transform JSX/TSX to JavaScript using Babel
        // Use typescript preset to strip type annotations, then react for JSX
        const transformed = Babel.transform(cleanedCode, {
            presets: ['react', 'typescript'],
            plugins: [],
            filename: 'email.tsx',
        }).code;

        // Create a function that returns the component
        // We need to provide React Email components as available variables
        const componentFactory = new Function(
            'React',
            'Html',
            'Head',
            'Body',
            'Container',
            'Section',
            'Row',
            'Column',
            'Text',
            'Button',
            'Link',
            'Img',
            'Hr',
            'Heading',
            'Preview',
            'Font',
            'Tailwind',
            `
            ${transformed}
            return typeof Email !== 'undefined' ? Email : (typeof exports !== 'undefined' && exports.default ? exports.default : null);
            `
        );

        // Execute the function to get the Email component
        const EmailComponent = componentFactory(
            React,
            ReactEmail.Html,
            ReactEmail.Head,
            ReactEmail.Body,
            ReactEmail.Container,
            ReactEmail.Section,
            ReactEmail.Row,
            ReactEmail.Column,
            ReactEmail.Text,
            ReactEmail.Button,
            ReactEmail.Link,
            ReactEmail.Img,
            ReactEmail.Hr,
            ReactEmail.Heading,
            ReactEmail.Preview,
            ReactEmail.Font,
            ReactEmail.Tailwind
        );

        if (!EmailComponent) {
            return res.status(400).json({
                error: 'No Email component found. Make sure to export a default function named "Email".'
            });
        }

        // Render the component to HTML
        const html = await render(React.createElement(EmailComponent), {
            pretty: true,
        });

        return res.status(200).json({ html });
    } catch (error) {
        console.error('React Email compilation error:', error);
        return res.status(400).json({
            error: error.message || 'Failed to compile React Email template'
        });
    }
}
