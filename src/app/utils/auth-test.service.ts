import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AuthTestService {

    constructor(private http: HttpClient) { }

    /**
     * Test authentication endpoint manually
     */
    async testAuthEndpoint(username: string, password: string): Promise<void> {
        console.group('🧪 Manual Auth Endpoint Test');

        try {
            const credentials = btoa(`${username}:${password}`);
            const headers = new HttpHeaders({
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            });

            console.log('Testing endpoint: /user');
            console.log('Credentials:', username, '(password hidden)');

            // Test with text response type to see raw response
            const response = await this.http.get('/user', {
                headers,
                responseType: 'text',
                observe: 'response'
            }).toPromise();

            console.log('✅ Response received:');
            console.log('Status:', response?.status);
            console.log('Headers:', response?.headers.keys());
            console.log('Content-Type:', response?.headers.get('content-type'));
            console.log('Raw Body:', response?.body);

            // Try JSON parsing
            if (response?.body) {
                try {
                    const parsed = JSON.parse(response.body);
                    console.log('✅ JSON parsing successful:', parsed);
                } catch (e) {
                    console.error('❌ JSON parsing failed:', e);
                }
            }

        } catch (error: any) {
            console.error('❌ Request failed:', error);
            console.error('Status:', error.status);
            console.error('Message:', error.message);
            console.error('Full error:', error);
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Test connectivity to backend
     */
    async testBackendConnectivity(): Promise<void> {
        console.group('🌐 Backend Connectivity Test');

        try {
            // Test if backend is reachable
            const response = await this.http.get('/user', {
                responseType: 'text',
                observe: 'response'
            }).toPromise();

            console.log('✅ Backend is reachable');
            console.log('Status:', response?.status);

            if (response?.status === 401) {
                console.log('✅ Endpoint exists (returns 401 as expected without auth)');
            }

        } catch (error: any) {
            console.error('❌ Backend connectivity issue:', error);

            if (error.status === 0) {
                console.error('🚨 CORS or network error - backend may not be running');
            } else if (error.status === 404) {
                console.error('🚨 Endpoint not found - /user endpoint may not exist');
            } else if (error.status === 401) {
                console.log('✅ Endpoint exists (returns 401 as expected without auth)');
            }
        } finally {
            console.groupEnd();
        }
    }
}

// Make it available globally for console testing
declare global {
    interface Window {
        testAuth: (username: string, password: string) => Promise<void>;
        testBackend: () => Promise<void>;
    }
}