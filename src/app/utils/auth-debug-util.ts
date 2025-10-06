/**
 * Authentication Debug Utility
 * Simple debugging tools for authentication issues
 */

export class AuthDebugUtil {
    /**
     * Debug localStorage contents related to authentication
     */
    static debugLocalStorage(): void {
        console.log('🔍 Authentication Debug - localStorage Contents:');
        console.log('================================================');

        const authData = localStorage.getItem('travner_auth');
        const userData = localStorage.getItem('travner_user');

        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                console.log('✅ travner_auth:', { username: parsed.username, password: '***' });

                if (parsed.username && parsed.password) {
                    console.log('  ✅ Valid auth structure');
                } else {
                    console.log('  ❌ Invalid auth structure - missing username/password');
                }
            } catch (e) {
                console.log('❌ travner_auth: [Invalid JSON]');
            }
        } else {
            console.log('❌ travner_auth: [Not Found]');
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                console.log('✅ travner_user:', parsed);
            } catch (e) {
                console.log('❌ travner_user: [Invalid JSON]');
            }
        } else {
            console.log('❌ travner_user: [Not Found]');
        }

        console.log('================================================');
    }

    /**
     * Test authentication manually
     */
    static testAuth(username: string, password: string): void {
        console.log('🧪 Testing Authentication...');

        // Store test auth data
        const authData = { username, password };
        localStorage.setItem('travner_auth', JSON.stringify(authData));

        console.log('✅ Test auth data stored:', { username, password: '***' });

        // Verify it can be read back
        const retrieved = localStorage.getItem('travner_auth');
        if (retrieved) {
            const parsed = JSON.parse(retrieved);
            console.log('✅ Auth data retrieved successfully:', { username: parsed.username, password: '***' });
        } else {
            console.error('❌ Failed to retrieve auth data');
        }

        this.debugLocalStorage();
    }

    /**
     * Clear all authentication data
     */
    static clearAuth(): void {
        console.log('🧹 Clearing all authentication data...');

        const authKeys = ['travner_auth', 'travner_user'];
        authKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`✅ Cleared ${key}`);
        });

        console.log('🧹 Auth data cleared');
        this.debugLocalStorage();
    }

    /**
     * Show current authentication status
     */
    static showAuthStatus(): void {
        console.log('📊 Current Authentication Status:');
        console.log('================================');

        const authData = localStorage.getItem('travner_auth');
        const userData = localStorage.getItem('travner_user');

        if (authData && userData) {
            try {
                const auth = JSON.parse(authData);
                const user = JSON.parse(userData);

                console.log('✅ Authentication Status: AUTHENTICATED');
                console.log('👤 User:', user.userName || user.username);
                console.log('🔑 Has Credentials:', !!(auth.username && auth.password));
                console.log('📧 Email:', user.email);
                console.log('🏷️ Roles:', user.roles || 'None');
            } catch (e) {
                console.log('❌ Authentication Status: ERROR - Invalid data format');
            }
        } else {
            console.log('❌ Authentication Status: NOT AUTHENTICATED');
        }

        console.log('================================');
    }
}

// Make it available globally for easy debugging
declare global {
    interface Window {
        authDebug: typeof AuthDebugUtil;
    }
}

if (typeof window !== 'undefined') {
    window.authDebug = AuthDebugUtil;
}