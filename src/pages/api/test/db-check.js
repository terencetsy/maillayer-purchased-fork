import connectToDatabase from '@/lib/mongodb';

export default async function handler(req, res) {
    try {
        const start = Date.now();
        const db = await connectToDatabase();
        const duration = Date.now() - start;

        // Try a simple operation
        const collections = await db.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        return res.status(200).json({
            status: 'success',
            message: 'Connected to MongoDB successfully',
            database_name: db.connection.db.databaseName,
            collections: collectionNames,
            connection_time_ms: duration
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to connect to MongoDB',
            error_name: error.name,
            error_message: error.message,
            // Only show partial stack in production for security, but helpful for debugging
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
