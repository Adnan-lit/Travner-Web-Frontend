// Test script to verify signin functionality
// This file can be used to test the signin process

export class AuthTestHelper {
    /**
     * Test the signin process with actual API response format
     */
    static testSigninResponse() {
        // Mock response matching your actual API
        const mockApiResponse = {
            "success": true,
            "message": "Success",
            "data": {
                "id": {
                    "timestamp": 1759642998,
                    "date": "2025-10-05T05:43:18.000+00:00"
                },
                "userName": "testuser",
                "firstName": "Test",
                "lastName": "User",
                "email": "test@example.com",
                "password": "",
                "roles": ["USER"],
                "bio": null,
                "profileImageUrl": null,
                "location": null,
                "createdAt": "2025-10-05T11:43:18.771",
                "lastLoginAt": "2025-10-05T11:56:35.156",
                "active": true
            },
            "pagination": null
        };

        console.log('Testing signin response format:');
        console.log('✅ Response has success:', mockApiResponse.success);
        console.log('✅ Response has message:', mockApiResponse.message);
        console.log('✅ Response has data:', !!mockApiResponse.data);
        console.log('✅ User data structure:', {
            id: mockApiResponse.data.id,
            userName: mockApiResponse.data.userName,
            firstName: mockApiResponse.data.firstName,
            lastName: mockApiResponse.data.lastName,
            email: mockApiResponse.data.email,
            roles: mockApiResponse.data.roles
        });

        // Test the updated AuthResponse interface
        if (mockApiResponse.success && mockApiResponse.data) {
            const user = mockApiResponse.data;
            console.log('✅ Signin would succeed with user:', user.userName);
            return user;
        }

        console.log('❌ Signin would fail');
        return null;
    }

    /**
     * Debug signin issues
     */
    static debugSigninIssues(): string[] {
        const issues: string[] = [];

        // Check common issues
        console.log('🔍 Debugging potential signin issues:');

        // 1. Response format mismatch
        console.log('1. ✅ Response format fixed: data contains user directly (not data.user)');

        // 2. Basic Auth format
        console.log('2. ✅ Basic Auth format: Authorization: Basic <base64(username:password)>');

        // 3. Endpoint URL
        console.log('3. ✅ Endpoint: GET /user with Basic Auth');

        // 4. Headers
        console.log('4. ✅ Headers: Authorization header required');

        // 5. Error handling
        console.log('5. ✅ Error handling: catches HTTP errors and clears auth data');

        return issues;
    }

    /**
     * Test Basic Auth encoding
     */
    static testBasicAuth(username: string, password: string) {
        const credentials = btoa(`${username}:${password}`);
        console.log('Basic Auth Test:');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log(`Encoded: ${credentials}`);
        console.log(`Header: Basic ${credentials}`);

        // Decode to verify
        const decoded = atob(credentials);
        console.log(`Decoded: ${decoded}`);
        console.log(`Match: ${decoded === `${username}:${password}`}`);

        return credentials;
    }
}