const { MongoClient } = require('mongodb');

async function cleanupInvalidMediaUrls() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('travner');
        const postsCollection = db.collection('posts');
        
        // Find posts with invalid media URLs
        const postsWithInvalidUrls = await postsCollection.find({
            "mediaUrls": { $in: ["/api/media/null", "null"] }
        }).toArray();
        
        console.log(`Found ${postsWithInvalidUrls.length} posts with invalid media URLs`);
        
        if (postsWithInvalidUrls.length > 0) {
            // Remove invalid media URLs from all posts
            const result = await postsCollection.updateMany(
                { "mediaUrls": { $in: ["/api/media/null", "null"] } },
                { $pull: { "mediaUrls": { $in: ["/api/media/null", "null"] } } }
            );
            
            console.log(`Updated ${result.modifiedCount} posts`);
            
            // Set empty mediaUrls for posts that only had invalid URLs
            const emptyResult = await postsCollection.updateMany(
                { "mediaUrls": { $eq: [] } },
                { $set: { "mediaUrls": [] } }
            );
            
            console.log(`Set empty mediaUrls for ${emptyResult.modifiedCount} posts`);
        }
        
        // Verify cleanup
        const remainingInvalid = await postsCollection.countDocuments({
            "mediaUrls": { $in: ["/api/media/null", "null"] }
        });
        
        console.log(`Remaining posts with invalid media URLs: ${remainingInvalid}`);
        
        // Show final stats
        const totalPosts = await postsCollection.countDocuments();
        const postsWithMedia = await postsCollection.countDocuments({
            "mediaUrls": { $exists: true, $ne: [] }
        });
        
        console.log(`Total posts: ${totalPosts}`);
        console.log(`Posts with valid media: ${postsWithMedia}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the cleanup
cleanupInvalidMediaUrls();

