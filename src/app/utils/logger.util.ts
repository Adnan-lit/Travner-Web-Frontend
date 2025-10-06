// Production-safe logging utility
export class Logger {
    private static isDevelopment(): boolean {
        return !window.location.hostname.includes('vercel.app') &&
            (window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1');
    }

    private static isDebugEnabled(): boolean {
        return localStorage.getItem('travner_debug') === 'true';
    }

    static log(message: string, ...data: any[]): void {
        if (this.isDevelopment() && this.isDebugEnabled()) {
            console.log(message, ...data);
        }
    }

    static warn(message: string, ...data: any[]): void {
        if (this.isDevelopment() || this.isDebugEnabled()) {
            console.warn(message, ...data);
        }
    }

    static error(message: string, ...data: any[]): void {
        // Always log errors
        console.error(message, ...data);
    }

    static info(message: string, ...data: any[]): void {
        if (this.isDevelopment() && this.isDebugEnabled()) {
            console.info(message, ...data);
        }
    }

    static debug(component: string, message: string, data?: any): void {
        if (this.isDevelopment() && this.isDebugEnabled()) {
            console.log(`[${component}] ${message}`, data || '');
        }
    }
}