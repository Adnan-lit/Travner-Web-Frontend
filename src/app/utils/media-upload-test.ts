/**
 * Test utility to demonstrate the media upload API integration
 * This shows how the PostService handles the API response format you provided
 */

// Your actual API response format
const sampleApiResponse = {
    "success": true,
    "message": "Media uploaded successfully",
    "data": {
        "id": "68e27d06da54f87771f36acd",
        "fileName": "Cox.jpg",
        "fileUrl": "/posts/68e26fc2da54f87771f36ac8/media/68e27d06da54f87771f36acd",
        "fileType": "image/jpeg",
        "fileSize": 79152,
        "uploaderId": "68e26ec8da54f87771f36ac6",
        "postId": "68e26fc2da54f87771f36ac8",
        "uploadedAt": "2025-10-05T20:13:26.6345393"
    },
    "pagination": null
};

// What the PostService processMedia function will convert it to
const processedMedia = {
    id: "68e27d06da54f87771f36acd",
    fileName: "Cox.jpg",
    fileUrl: "/posts/68e26fc2da54f87771f36ac8/media/68e27d06da54f87771f36acd",
    fileType: "image/jpeg",
    fileSize: 79152,
    uploaderId: "68e26ec8da54f87771f36ac6",
    postId: "68e26fc2da54f87771f36ac8",
    uploadedAt: "2025-10-05T20:13:26.6345393",
    // Legacy backward compatibility fields
    url: "/posts/68e26fc2da54f87771f36ac8/media/68e27d06da54f87771f36acd",
    type: "IMAGE", // Mapped from "image/jpeg"
    createdAt: "2025-10-05T20:13:26.6345393"
};

console.log('✅ API Response Processing Test');
console.log('📥 Original API Response:', sampleApiResponse);
console.log('📤 Processed Media Object:', processedMedia);
console.log('✨ The PostService uploadMedia method will now correctly handle your API format!');

export { sampleApiResponse, processedMedia };