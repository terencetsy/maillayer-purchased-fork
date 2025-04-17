// Utility functions for working with Google Sheets integration

/**
 * Initialize Google Sheets client for a specific brand
 * @param {string} brandId - The brand ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} - Google Sheets client instance
 */
export async function initializeGoogleSheetsClient(brandId, userId) {
    try {
        // Get the Google Sheets integration from the database
        const res = await fetch(`/api/brands/${id}/integrations/google-sheets`, {
            credentials: 'same-origin',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch Google Sheets integration');
        }

        const integration = await res.json();

        if (!integration || integration.status !== 'active') {
            throw new Error('Google Sheets integration not configured or inactive');
        }

        // In a real implementation, you would use the Google Sheets API client library
        // For the purpose of this example, we'll create a simplified client
        const serviceAccount = integration.config.serviceAccount;

        // Create a simple client object
        const sheetsClient = {
            serviceAccount,
            projectId: integration.config.projectId,

            /**
             * List all spreadsheets accessible by the service account
             * @returns {Promise<Array>} - List of spreadsheets
             */
            async listSpreadsheets() {
                // In a real implementation, this would make an API call to the Google Sheets API
                // For this example, we'll return a placeholder
                return [{ id: 'example-spreadsheet-id', name: 'Example Spreadsheet' }];
            },

            /**
             * Get a specific spreadsheet
             * @param {string} spreadsheetId - The spreadsheet ID
             * @returns {Promise<object>} - Spreadsheet data
             */
            async getSpreadsheet(spreadsheetId) {
                // In a real implementation, this would fetch the spreadsheet from the API
                return {
                    id: spreadsheetId,
                    name: 'Example Spreadsheet',
                    sheets: [{ id: 'sheet1', name: 'Sheet1' }],
                };
            },

            /**
             * Read data from a specific sheet
             * @param {string} spreadsheetId - The spreadsheet ID
             * @param {string} range - The sheet range (e.g., 'Sheet1!A1:Z1000')
             * @returns {Promise<Array>} - Sheet data
             */
            async readSheet(spreadsheetId, range) {
                // In a real implementation, this would read data from the sheet
                return [
                    ['Email', 'First Name', 'Last Name', 'Status'],
                    ['user1@example.com', 'John', 'Doe', 'active'],
                    ['user2@example.com', 'Jane', 'Smith', 'active'],
                ];
            },

            /**
             * Write data to a specific sheet
             * @param {string} spreadsheetId - The spreadsheet ID
             * @param {string} range - The sheet range (e.g., 'Sheet1!A1:Z1000')
             * @param {Array} values - The data to write
             * @returns {Promise<object>} - Result of the write operation
             */
            async writeSheet(spreadsheetId, range, values) {
                // In a real implementation, this would write data to the sheet
                return {
                    updatedRange: range,
                    updatedRows: values.length,
                    updatedCells: values.reduce((acc, row) => acc + row.length, 0),
                };
            },
        };

        return sheetsClient;
    } catch (error) {
        console.error('Error initializing Google Sheets client:', error);
        throw error;
    }
}

/**
 * Import contacts from Google Sheets to a contact list
 * @param {string} brandId - The brand ID
 * @param {string} userId - The user ID
 * @param {string} spreadsheetId - The spreadsheet ID
 * @param {string} sheetName - The sheet name
 * @param {string} listId - The contact list ID
 * @param {object} fieldMapping - Mapping of sheet columns to contact fields
 * @returns {Promise<object>} - Import results
 */
export async function importContactsFromSheet(brandId, userId, spreadsheetId, sheetName, listId, fieldMapping) {
    try {
        const sheetsClient = await initializeGoogleSheetsClient(brandId, userId);

        // Read data from the sheet
        const range = `${sheetName}!A1:Z1000`;
        const sheetData = await sheetsClient.readSheet(spreadsheetId, range);

        if (!sheetData || sheetData.length <= 1) {
            throw new Error('Sheet is empty or contains only headers');
        }

        // Get the headers from the first row
        const headers = sheetData[0];

        // Transform sheet data to contacts format
        const contacts = [];

        for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            const contact = {};

            // Map sheet columns to contact fields
            Object.entries(fieldMapping).forEach(([contactField, columnName]) => {
                const columnIndex = headers.findIndex((header) => header === columnName);
                if (columnIndex !== -1 && row[columnIndex]) {
                    contact[contactField] = row[columnIndex];
                }
            });

            // Ensure email is present and valid
            if (contact.email && contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                contacts.push(contact);
            }
        }

        if (contacts.length === 0) {
            throw new Error('No valid contacts found in the sheet');
        }

        // Import contacts to the list
        const importRes = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contacts,
                skipDuplicates: true,
            }),
            credentials: 'same-origin',
        });

        if (!importRes.ok) {
            const errorData = await importRes.json();
            throw new Error(errorData.message || 'Failed to import contacts');
        }

        const importResult = await importRes.json();

        return {
            success: true,
            source: 'Google Sheets',
            spreadsheetName: 'Example Spreadsheet',
            sheetName,
            ...importResult,
        };
    } catch (error) {
        console.error('Error importing contacts from Google Sheets:', error);
        throw error;
    }
}

/**
 * Export contacts to Google Sheets
 * @param {string} brandId - The brand ID
 * @param {string} userId - The user ID
 * @param {string} listId - The contact list ID
 * @param {string} spreadsheetId - The spreadsheet ID
 * @param {string} sheetName - The sheet name
 * @returns {Promise<object>} - Export results
 */
export async function exportContactsToSheet(brandId, userId, listId, spreadsheetId, sheetName) {
    try {
        const sheetsClient = await initializeGoogleSheetsClient(brandId, userId);

        // Fetch contacts from the list
        const res = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/export`, {
            credentials: 'same-origin',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch contacts for export');
        }

        // Process the CSV data
        const csvData = await res.text();
        const rows = csvData.split('\n').map((row) => row.split(','));

        // Write data to the sheet
        const range = `${sheetName}!A1`;
        const result = await sheetsClient.writeSheet(spreadsheetId, range, rows);

        return {
            success: true,
            destination: 'Google Sheets',
            spreadsheetName: 'Example Spreadsheet',
            sheetName,
            rowsExported: rows.length - 1, // Excluding header row
        };
    } catch (error) {
        console.error('Error exporting contacts to Google Sheets:', error);
        throw error;
    }
}
