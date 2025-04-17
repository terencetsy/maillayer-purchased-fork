/**
 * Utility functions for interacting with the Airtable API
 */

/**
 * Fetch records from an Airtable table with pagination support
 * @param {string} apiKey - Airtable API Key
 * @param {string} baseId - Airtable Base ID
 * @param {string} tableName - Name of the table to query
 * @param {Object} options - Additional options
 * @param {string} options.view - Name of the view to use
 * @param {number} options.maxRecords - Maximum number of records to retrieve
 * @param {string} options.filterByFormula - Airtable formula to filter records
 * @returns {Promise<Array>} - Array of records
 */
export async function fetchAirtableRecords(apiKey, baseId, tableName, options = {}) {
    if (!apiKey || !baseId || !tableName) {
        throw new Error('Missing required Airtable parameters');
    }

    try {
        let allRecords = [];
        let offset = null;
        const limit = 100; // Max records per request

        // Build query parameters
        const queryParams = new URLSearchParams({
            pageSize: limit,
            ...(options.view && { view: options.view }),
            ...(options.maxRecords && { maxRecords: options.maxRecords }),
            ...(options.filterByFormula && { filterByFormula: options.filterByFormula }),
        });

        // Fetch all pages of results
        do {
            if (offset) {
                queryParams.set('offset', offset);
            }

            const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${queryParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Airtable API error: ${response.status}`);
            }

            const data = await response.json();
            allRecords = [...allRecords, ...data.records];
            offset = data.offset || null;

            // If maxRecords is specified and we've reached it, stop pagination
            if (options.maxRecords && allRecords.length >= options.maxRecords) {
                allRecords = allRecords.slice(0, options.maxRecords);
                break;
            }
        } while (offset);

        return allRecords;
    } catch (error) {
        console.error('Error fetching Airtable records:', error);
        throw error;
    }
}

/**
 * Import contacts from Airtable into the system
 * @param {Object} integration - The Airtable integration object from the database
 * @param {Object} options - Import options
 * @param {string} options.listId - The contact list ID to import into
 * @param {string} options.emailField - The field name in Airtable for email
 * @param {string} options.firstNameField - The field name in Airtable for first name
 * @param {string} options.lastNameField - The field name in Airtable for last name
 * @param {boolean} options.skipDuplicates - Whether to skip duplicate emails
 * @returns {Promise<Object>} - Import results
 */
export async function importContactsFromAirtable(integration, options) {
    const { config } = integration;
    const { apiKey, baseId, tableName } = config;
    const { listId, emailField = 'Email', firstNameField = 'First Name', lastNameField = 'Last Name', skipDuplicates = true } = options;

    if (!listId) {
        throw new Error('Contact list ID is required');
    }

    try {
        // Fetch records from Airtable
        const records = await fetchAirtableRecords(apiKey, baseId, tableName);

        // Transform Airtable records to contact format
        const contacts = records
            .map((record) => {
                const fields = record.fields;
                return {
                    email: fields[emailField] || '',
                    firstName: fields[firstNameField] || '',
                    lastName: fields[lastNameField] || '',
                    // Additional fields can be mapped here
                };
            })
            .filter((contact) => contact.email); // Only keep records with email addresses

        // Prepare import results
        const importResults = {
            total: contacts.length,
            valid: contacts.length,
            invalid: 0,
            duplicates: 0,
            imported: 0,
        };

        if (contacts.length === 0) {
            return importResults;
        }

        // Make API request to import contacts
        const response = await fetch(`/api/brands/${integration.brandId}/contact-lists/${listId}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contacts,
                skipDuplicates,
            }),
            credentials: 'same-origin',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to import contacts');
        }

        const result = await response.json();

        // Update import results with actual import counts
        importResults.imported = result.imported || 0;
        importResults.duplicates = result.skipped || 0;

        return importResults;
    } catch (error) {
        console.error('Error importing contacts from Airtable:', error);
        throw error;
    }
}

/**
 * Get the list of tables from an Airtable base
 * @param {string} apiKey - Airtable API Key
 * @param {string} baseId - Airtable Base ID
 * @returns {Promise<Array>} - Array of table names
 */
export async function getAirtableTables(apiKey, baseId) {
    if (!apiKey || !baseId) {
        throw new Error('Missing required Airtable parameters');
    }

    try {
        const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        return data.tables.map((table) => ({
            id: table.id,
            name: table.name,
            fields: table.fields.map((field) => ({
                id: field.id,
                name: field.name,
                type: field.type,
            })),
        }));
    } catch (error) {
        console.error('Error fetching Airtable tables:', error);
        throw error;
    }
}
