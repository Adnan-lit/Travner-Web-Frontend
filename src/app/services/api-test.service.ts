import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ApiTestService {
    private readonly API_BASE_URL = 'https://travner-backend.up.railway.app';

    constructor(private http: HttpClient) { }

    // Test if the API is reachable
    async testApiConnectivity() {
        console.log('=== API Connectivity Test ===');
        console.log('Testing API at:', this.API_BASE_URL);

        // First, test basic connectivity to the base URL
        try {
            console.log('1. Testing basic connectivity...');
            const response = await fetch(this.API_BASE_URL, {
                method: 'HEAD',
                mode: 'cors'
            });
            console.log('Base URL reachable:', response.status);
        } catch (error) {
            console.error('Base URL test failed:', error);
        }

        // Test OPTIONS request to check CORS
        try {
            console.log('2. Testing CORS preflight...');
            const response = await fetch(`${this.API_BASE_URL}/public/create-user`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': window.location.origin,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });
            console.log('CORS preflight status:', response.status);
            console.log('CORS headers:', Object.fromEntries(response.headers.entries()));
        } catch (error) {
            console.error('CORS preflight failed:', error);
        }

        try {
            console.log('3. Testing signup endpoint...');
            // Test basic connectivity to the signup endpoint
            const response = await fetch(`${this.API_BASE_URL}/public/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: 'test_user_' + Date.now(),
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'testpass123'
                })
            });

            console.log('Signup API Status:', response.status);
            console.log('Signup API Headers:', Object.fromEntries(response.headers.entries()));
            const responseText = await response.text();
            console.log('Signup API Response:', responseText);

        } catch (error: any) {
            console.error('Signup API Error Details:', {
                name: error?.name || 'Unknown',
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace'
            });
        }

        try {
            // Test signin endpoint with invalid credentials (should return 401)
            const credentials = btoa('invalid_user:invalid_pass');
            const response = await fetch(`${this.API_BASE_URL}/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Signin API Status (with invalid creds):', response.status);
            console.log('Signin API Response:', await response.text());

        } catch (error) {
            console.error('Signin API Error:', error);
        }
    }

    // Test with specific username/password
    async testSigninWithCredentials(username: string, password: string) {
        console.log(`=== Testing Signin: ${username} ===`);

        try {
            const credentials = btoa(`${username}:${password}`);
            const response = await fetch(`${this.API_BASE_URL}/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const data = await response.json();
                console.log('Response Data:', data);
            } else {
                const text = await response.text();
                console.log('Error Response:', text);
            }

        } catch (error: any) {
            console.error('Network Error Details:', {
                name: error?.name || 'Unknown',
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace'
            });
        }
    }

    // Test direct API accessibility
    testDirectApiAccess() {
        console.log('=== Direct API Access Test ===');
        console.log('API Base URL:', this.API_BASE_URL);
        console.log('Current Origin:', window.location.origin);
        console.log('');
        console.log('Manual Tests:');
        console.log(`1. Open in new tab: ${this.API_BASE_URL}`);
        console.log(`2. Test signup endpoint: ${this.API_BASE_URL}/public/create-user`);
        console.log(`3. Test user endpoint: ${this.API_BASE_URL}/user`);
        console.log('');
        console.log('If these URLs are not accessible, the backend server may be down.');

        // Try to open the API URL in a new window
        try {
            const newWindow = window.open(this.API_BASE_URL, '_blank');
            if (!newWindow) {
                console.log('Popup blocked - manually navigate to:', this.API_BASE_URL);
            }
        } catch (error) {
            console.error('Could not open API URL:', error);
        }
    }
}