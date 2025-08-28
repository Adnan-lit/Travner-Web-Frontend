// Debug utility for testing admin functionality
// This file can be used in browser console to test admin API calls

export class AdminDebugger {

    /**
     * Test authentication status
     */
    static checkAuth() {
        const stored = localStorage.getItem('travner_auth');
        const user = localStorage.getItem('travner_user');

        console.log('🔍 Authentication Check:');
        console.log('📦 Stored auth:', stored ? 'Yes' : 'No');
        console.log('👤 Stored user:', user ? JSON.parse(user) : 'None');

        if (stored) {
            const authData = JSON.parse(stored);
            console.log('🔑 Auth data:', authData);
        }

        return { stored, user };
    }

    /**
     * Test admin API endpoints manually
     */
    static async testAdminAPI() {
        const stored = localStorage.getItem('travner_auth');
        if (!stored) {
            console.error('❌ No authentication data found');
            return;
        }

        const { username, password } = JSON.parse(stored);
        const credentials = btoa(`${username}:${password}`);
        const baseUrl = 'https://travner-backend.up.railway.app/admin';

        const headers = {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        console.log('🧪 Testing admin API endpoints...');
        console.log('🔗 Base URL:', baseUrl);
        console.log('🔑 Headers:', headers);

        try {
            // Test stats endpoint
            console.log('📊 Testing /stats endpoint...');
            const statsResponse = await fetch(`${baseUrl}/stats`, {
                method: 'GET',
                headers,
                credentials: 'omit'
            });

            console.log('📊 Stats response status:', statsResponse.status);
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                console.log('✅ Stats data:', stats);
            } else {
                const error = await statsResponse.text();
                console.log('❌ Stats error:', error);
            }

            // Test users endpoint
            console.log('👥 Testing /users endpoint...');
            const usersResponse = await fetch(`${baseUrl}/users`, {
                method: 'GET',
                headers,
                credentials: 'omit'
            });

            console.log('👥 Users response status:', usersResponse.status);
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                console.log('✅ Users data:', users);
            } else {
                const error = await usersResponse.text();
                console.log('❌ Users error:', error);
            }

        } catch (error) {
            console.error('💥 API test failed:', error);
        }
    }

    /**
     * Create test admin user credentials
     */
    static setTestAdminAuth() {
        const testAuth = {
            username: 'admin',
            password: 'admin123'
        };

        const testUser = {
            id: '1',
            userName: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@travner.com',
            roles: ['ADMIN', 'USER']
        };

        localStorage.setItem('travner_auth', JSON.stringify(testAuth));
        localStorage.setItem('travner_user', JSON.stringify(testUser));

        console.log('✅ Test admin credentials set');
        console.log('👤 Username: admin');
        console.log('🔑 Password: admin123');
        console.log('🔄 Please refresh the page to test');
    }

    /**
     * Clear all authentication data
     */
    static clearAuth() {
        localStorage.removeItem('travner_auth');
        localStorage.removeItem('travner_user');
        console.log('🧹 Authentication data cleared');
    }

    /**
     * View current page state
     */
    static checkPageState() {
        console.log('🌐 Current URL:', window.location.href);
        console.log('📄 Page title:', document.title);

        // Check if admin component is loaded
        const adminComponent = document.querySelector('.admin-container');
        console.log('🎛️ Admin component found:', !!adminComponent);

        if (adminComponent) {
            const debugInfo = adminComponent.querySelector('.debug-info');
            console.log('🐛 Debug info visible:', !!debugInfo);

            if (debugInfo) {
                console.log('📊 Debug content:', debugInfo.textContent);
            }
        }
    }
}

// Make it globally available for browser console
(window as any).AdminDebugger = AdminDebugger;

console.log('🔧 AdminDebugger loaded. Available methods:');
console.log('- AdminDebugger.checkAuth()');
console.log('- AdminDebugger.testAdminAPI()');
console.log('- AdminDebugger.setTestAdminAuth()');
console.log('- AdminDebugger.clearAuth()');
console.log('- AdminDebugger.checkPageState()');