import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthDebugService {

    /**
     * Debug HTTP responses to understand parsing issues
     */
    static debugHttpResponse(response: any, endpoint: string): void {
        console.group(`🔍 HTTP Response Debug for ${endpoint}`);

        try {
            console.log('📊 Response Overview:');
            console.log('  - Status:', response.status);
            console.log('  - Status Text:', response.statusText);
            console.log('  - Content-Type:', response.headers?.get?.('content-type') || 'Not available');
            console.log('  - Response URL:', response.url);

            console.log('📄 Raw Response Body:');
            console.log('  - Type:', typeof response.body);
            console.log('  - Length:', response.body?.length || 0);
            console.log('  - Content:', response.body);

            if (response.body && typeof response.body === 'string') {
                console.log('🔤 String Analysis:');
                console.log('  - Trimmed:', response.body.trim());
                console.log('  - Starts with {:', response.body.trim().startsWith('{'));
                console.log('  - Starts with [:', response.body.trim().startsWith('['));
                console.log('  - Is empty:', !response.body.trim());

                // Try to detect common response types
                const trimmed = response.body.trim();
                if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
                    console.warn('⚠️  Response appears to be HTML (possibly error page)');
                } else if (trimmed.startsWith('<?xml')) {
                    console.warn('⚠️  Response appears to be XML');
                } else if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    console.warn('⚠️  Response appears to be plain text, not JSON');
                }
            }

            // Try JSON parsing with detailed error info
            if (response.body && typeof response.body === 'string') {
                try {
                    const parsed = JSON.parse(response.body.trim());
                    console.log('✅ JSON Parse Success:', parsed);

                    // Analyze the structure
                    if (parsed.success !== undefined) {
                        console.log('🏷️  Appears to be wrapped response format');
                        console.log('  - Success:', parsed.success);
                        console.log('  - Message:', parsed.message);
                        console.log('  - Has Data:', !!parsed.data);
                    } else if (parsed.userName || parsed.username) {
                        console.log('🏷️  Appears to be direct user object');
                    } else {
                        console.log('🏷️  Unknown response structure');
                    }
                } catch (e: any) {
                    console.error('❌ JSON Parse Failed:', e.message);
                    console.error('  - Error at position:', this.findJsonErrorPosition(response.body.trim(), e.message));
                }
            }

        } catch (error) {
            console.error('Debug utility error:', error);
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Find position of JSON parsing error for better debugging
     */
    private static findJsonErrorPosition(json: string, errorMessage: string): string {
        const positionMatch = errorMessage.match(/position (\d+)/);
        if (positionMatch) {
            const pos = parseInt(positionMatch[1]);
            const start = Math.max(0, pos - 20);
            const end = Math.min(json.length, pos + 20);
            return `"${json.substring(start, end)}" (around position ${pos})`;
        }
        return 'Position not found in error message';
    }

    /**
     * Debug network request details
     */
    static debugRequestDetails(url: string, headers: any, method: string = 'GET'): void {
        console.group(`🌐 Request Debug for ${method} ${url}`);
        console.log('📤 Request Details:');
        console.log('  - URL:', url);
        console.log('  - Method:', method);
        console.log('  - Headers:', headers);

        // Check for common auth issues
        if (headers && headers.Authorization) {
            console.log('🔐 Authentication:');
            console.log('  - Auth Type:', headers.Authorization.split(' ')[0]);
            console.log('  - Has Credentials:', headers.Authorization.length > 10);
        } else {
            console.warn('⚠️  No Authorization header found');
        }

        console.groupEnd();
    }
}