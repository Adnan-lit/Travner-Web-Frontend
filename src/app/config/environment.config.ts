/**
 * Environment configuration for API endpoints
 */
export class EnvironmentConfig {
    /**
     * Get the appropriate API base URL based on environment
     */
    static getApiBaseUrl(): string {
        const hostname = window.location.hostname;

        if (hostname === 'travner.vercel.app' || hostname.includes('vercel.app')) {
            // Production: Vercel deployment using Railway backend
            console.log('🌐 Production environment detected - using Railway backend');
            return 'https://travner-web-backend-production.up.railway.app'; // no trailing slash
        } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
            // Development: prefer Angular proxy to avoid CORS: use relative '/api'
            console.log('🔧 Development environment detected - using proxy /api base');
            return '/api';
        } else {
            // Other environments (like Railway deployment) - use Railway backend
            console.log('🌐 Other environment detected - using Railway backend');
            return 'https://travner-web-backend-production.up.railway.app'; // no trailing slash
        }
    }

    /**
     * Get the appropriate WebSocket URL based on environment
     */
    static getWebSocketUrl(): string {
        const hostname = window.location.hostname;

        if (hostname === 'travner.vercel.app' || hostname.includes('vercel.app')) {
            console.log('🌐 Production WebSocket - using Railway backend');
            return 'https://travner-web-backend-production.up.railway.app/ws';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
            // Use direct localhost for WS (proxy typically not used for ws by default)
            console.log('🔧 Development WebSocket - using local backend');
            return 'http://localhost:8080/ws';
        } else {
            console.log('🌐 Other environment WebSocket - using Railway backend');
            return 'https://travner-web-backend-production.up.railway.app/ws';
        }
    }

    /**
     * Check if running in production environment
     */
    static isProduction(): boolean {
        const hostname = window.location.hostname;
        return hostname === 'travner.vercel.app' || hostname.includes('vercel.app');
    }

    /**
     * Check if running in development environment
     */
    static isDevelopment(): boolean {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
    }

    /**
     * Get environment name for debugging
     */
    static getEnvironmentName(): string {
        if (this.isProduction()) return 'production';
        if (this.isDevelopment()) return 'development';
        return 'unknown';
    }

    /**
     * Log environment information for debugging
     */
    static logEnvironmentInfo(): void {
        console.log('🔧 Environment Information:');
        console.log('  - Hostname:', window.location.hostname);
        console.log('  - Origin:', window.location.origin);
        console.log('  - Environment:', this.getEnvironmentName());
        console.log('  - API Base URL:', this.getApiBaseUrl());
        console.log('  - WebSocket URL:', this.getWebSocketUrl());
    }
}
